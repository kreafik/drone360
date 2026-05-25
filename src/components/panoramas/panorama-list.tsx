"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PanoramaCard } from "./panorama-card";
import { UploadModal } from "@/components/upload/upload-modal";

export interface PanoramaItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  status: string;
  position: number;
}

interface PanoramaListProps {
  projectId: string;
  initialPanoramas: PanoramaItem[];
  initialCoverPanoramaId?: string | null;
  initialOverviewPanoramaId?: string | null;
}

export function PanoramaList({ projectId, initialPanoramas, initialCoverPanoramaId, initialOverviewPanoramaId }: PanoramaListProps) {
  const [panoramas, setPanoramas] = useState(initialPanoramas);
  const [coverPanoramaId, setCoverPanoramaId] = useState<string | null>(initialCoverPanoramaId ?? null);
  const [overviewPanoramaId, setOverviewPanoramaId] = useState<string | null>(initialOverviewPanoramaId ?? null);

  // Sync state when server component re-fetches data (e.g. after router.refresh()).
  // useState only uses the initial value on mount; this effect keeps it in sync.
  useEffect(() => { setPanoramas(initialPanoramas); }, [initialPanoramas]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = panoramas.findIndex((p) => p.id === active.id);
    const newIndex = panoramas.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(panoramas, oldIndex, newIndex);
    setPanoramas(reordered);

    const res = await fetch(`/api/projects/${projectId}/panoramas/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((p) => p.id) }),
    });

    if (!res.ok) {
      toast.error("Sıralama kaydedilemedi.");
      setPanoramas(panoramas);
    }
  }

  function handleDelete(id: string) {
    setPanoramas((prev) => prev.filter((p) => p.id !== id));
  }

  function handleTitleChange(id: string, title: string) {
    setPanoramas((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
  }

  async function handleSetOverview(id: string) {
    const res = await fetch(`/api/projects/${projectId}/overview`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ panoramaId: id }),
    });
    if (res.ok) {
      setOverviewPanoramaId(id);
      toast.success("Harita panoraması güncellendi.");
    } else {
      toast.error("Harita panoraması ayarlanamadı.");
    }
  }

  async function handleSetCover(id: string) {
    const res = await fetch(`/api/projects/${projectId}/cover`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ panoramaId: id }),
    });

    if (res.ok) {
      setCoverPanoramaId(id);
      toast.success("Kapak fotoğrafı güncellendi.");
    } else {
      toast.error("Kapak fotoğrafı ayarlanamadı.");
    }
  }

  if (panoramas.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <UploadModal projectId={projectId} />
        </div>
        <div className="flex flex-col items-center text-center py-16 rounded-xl border border-dashed border-border">
          <div className="size-14 rounded-full bg-surface-elevated grid place-items-center mb-4">
            <ImageIcon className="size-6 text-subtle" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-xl mb-2">Henüz panorama yok</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            360° görüntülerinizi yükleyerek bu projeye ekleyin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {panoramas.length} panorama
        </p>
        <UploadModal projectId={projectId} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={panoramas.map((p) => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {panoramas.map((p) => (
              <PanoramaCard
                key={p.id}
                id={p.id}
                title={p.title}
                thumbnailUrl={p.thumbnailUrl}
                status={p.status}
                isCover={p.id === coverPanoramaId}
                isOverview={p.id === overviewPanoramaId}
                onDelete={handleDelete}
                onTitleChange={handleTitleChange}
                onSetCover={handleSetCover}
                onSetOverview={handleSetOverview}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
