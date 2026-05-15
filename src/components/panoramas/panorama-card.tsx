"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Check, X, ImageIcon, Star, Map } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PanoramaCardProps {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  status: string;
  isCover?: boolean;
  isOverview?: boolean;
  onDelete: (id: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onSetCover?: (id: string) => void;
  onSetOverview?: (id: string) => void;
}

export function PanoramaCard({
  id,
  title,
  thumbnailUrl,
  status,
  isCover = false,
  isOverview = false,
  onDelete,
  onTitleChange,
  onSetCover,
  onSetOverview,
}: PanoramaCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function saveTitle() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) {
      setDraft(title);
      setEditing(false);
      return;
    }

    const res = await fetch(`/api/panoramas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });

    if (res.ok) {
      onTitleChange(id, trimmed);
    } else {
      toast.error("Başlık kaydedilemedi.");
      setDraft(title);
    }
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/panoramas/${id}`, { method: "DELETE" });
    if (res.ok) {
      onDelete(id);
      setConfirmOpen(false);
    } else {
      toast.error("Panorama silinemedi.");
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative rounded-xl border border-border bg-surface overflow-hidden",
          isDragging && "opacity-50 shadow-xl ring-2 ring-primary/40 z-50"
        )}
      >
        {/* Thumbnail */}
        <div className="aspect-video bg-surface-elevated relative">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="size-8 text-subtle" strokeWidth={1.5} />
            </div>
          )}

          {status !== "ready" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-white text-xs font-medium">
                {status === "processing" && "İşleniyor…"}
                {status === "uploading" && "Yükleniyor…"}
                {status === "failed" && "Yükleme başarısız"}
              </span>
            </div>
          )}

          {/* Badges row — bottom-left */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 pointer-events-none">
            {isCover && (
              <div className="flex items-center gap-1 rounded-md bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">
                <Star className="size-3 fill-current" />
                Kapak
              </div>
            )}
            {isOverview && (
              <div className="flex items-center gap-1 rounded-md bg-sky-500/90 px-2 py-0.5 text-xs font-medium text-white">
                <Map className="size-3" />
                Harita
              </div>
            )}
          </div>

          {/* Hover action buttons — only for ready panoramas that don't already have the badge */}
          {status === "ready" && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isCover && onSetCover && (
                <button
                  type="button"
                  onClick={() => onSetCover(id)}
                  className="flex items-center gap-1 rounded-md bg-black/50 hover:bg-primary/80 px-2 py-0.5 text-xs font-medium text-white"
                >
                  <Star className="size-3" />
                  Kapak Yap
                </button>
              )}
              {!isOverview && onSetOverview && (
                <button
                  type="button"
                  onClick={() => onSetOverview(id)}
                  className="flex items-center gap-1 rounded-md bg-black/50 hover:bg-sky-500/80 px-2 py-0.5 text-xs font-medium text-white"
                >
                  <Map className="size-3" />
                  Harita Yap
                </button>
              )}
            </div>
          )}

          {/* Drag handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 size-7 rounded-md bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
            tabIndex={-1}
          >
            <GripVertical className="size-4 text-white" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="absolute top-2 right-2 size-7 rounded-md bg-black/40 hover:bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="size-3.5 text-white" />
          </button>
        </div>

        {/* Title row */}
        <div className="px-3 py-2.5">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") {
                    setDraft(title);
                    setEditing(false);
                  }
                }}
                onBlur={saveTitle}
                autoFocus
                className="flex-1 min-w-0 bg-transparent border-b border-primary outline-none text-sm font-medium"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={saveTitle}
                className="shrink-0 text-success hover:opacity-80 transition-opacity"
              >
                <Check className="size-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setDraft(title);
                  setEditing(false);
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(title);
                setEditing(true);
              }}
              className="group/title flex items-center gap-1.5 w-full text-left"
            >
              <span className="text-sm font-medium truncate">{title}</span>
              <Pencil className="size-3 text-muted-foreground opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Panoramayı Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{title}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Siliniyor…" : "Sil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
