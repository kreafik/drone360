"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ViewerPanorama, ViewerHotspot } from "./panorama-viewer";

interface HotspotFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  panoramaId: string;
  allPanoramas: ViewerPanorama[];
  position?: { yaw: number; pitch: number };
  editing?: ViewerHotspot;
}

export function HotspotForm({
  open,
  onClose,
  onSaved,
  panoramaId,
  allPanoramas,
  position,
  editing,
}: HotspotFormProps) {
  const [type, setType] = useState<"link" | "info" | "pin">(editing?.type ?? "info");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [targetPanoramaId, setTargetPanoramaId] = useState(editing?.targetPanoramaId ?? "");
  const [saving, setSaving] = useState(false);

  const isEditing = !!editing;

  async function handleSave() {
    if (!position && !editing) return;

    setSaving(true);
    try {
      let res: Response;

      if (isEditing) {
        res = await fetch(`/api/hotspots/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || undefined,
            description: description || null,
            targetPanoramaId: type === "link" ? targetPanoramaId || null : null,
          }),
        });
      } else {
        if ((type === "link" || type === "pin") && !targetPanoramaId) {
          toast.error("Lütfen hedef panoramayı seçin.");
          setSaving(false);
          return;
        }
        res = await fetch("/api/hotspots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            panoramaId,
            type,
            yaw: position!.yaw,
            pitch: position!.pitch,
            title: title || undefined,
            description: description || undefined,
            targetPanoramaId: (type === "link" || type === "pin") ? targetPanoramaId : undefined,
          }),
        });
      }

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error?.message ?? "Hotspot kaydedilemedi.");
        return;
      }

      toast.success(isEditing ? "Hotspot güncellendi." : "Hotspot eklendi.");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Hotspot Düzenle" : "Hotspot Ekle"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type selector (only when creating) */}
          {!isEditing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("info")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  type === "info"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                ℹ Bilgi
              </button>
              <button
                type="button"
                onClick={() => setType("link")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  type === "link"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                ↗ Geçiş (Ok)
              </button>
              <button
                type="button"
                onClick={() => setType("pin")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  type === "pin"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                📍 Sabit Pin
              </button>
            </div>
          )}

          {/* Link / Pin: target panorama */}
          {(type === "link" || type === "pin") && (
            <div className="space-y-1.5">
              <Label>Hedef Panorama</Label>
              <select
                value={targetPanoramaId}
                onChange={(e) => setTargetPanoramaId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seçin…</option>
                {allPanoramas
                  .filter((p) => p.id !== panoramaId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label>
              {type === "info" ? "Başlık" : "Etiket (opsiyonel)"}
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "info" ? "Hotspot başlığı…" : "Pin etiketi…"}
              maxLength={100}
            />
          </div>

          {/* Description (info only) */}
          {type === "info" && (
            <div className="space-y-1.5">
              <Label>Açıklama (opsiyonel)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kısa açıklama…"
                rows={3}
                maxLength={500}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
