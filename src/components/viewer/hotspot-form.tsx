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
import type { TextHotspotMetadata } from "@/types/domain";

const selectCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

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
  const [type, setType] = useState<"link" | "info" | "pin" | "text">(
    editing?.type ?? "info"
  );
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [targetPanoramaId, setTargetPanoramaId] = useState(
    editing?.targetPanoramaId ?? ""
  );

  const editingMeta =
    editing?.type === "text"
      ? ((editing.metadata ?? {}) as Partial<TextHotspotMetadata>)
      : {};
  const [textContent, setTextContent] = useState(editingMeta.content ?? "");
  const [textFontSize, setTextFontSize] = useState<TextHotspotMetadata["fontSize"]>(
    editingMeta.fontSize ?? "md"
  );
  const [textFontWeight, setTextFontWeight] = useState<TextHotspotMetadata["fontWeight"]>(
    editingMeta.fontWeight ?? "normal"
  );
  const [textColor, setTextColor] = useState(editingMeta.color ?? "#ffffff");
  const [textBgColor, setTextBgColor] = useState(editingMeta.bgColor ?? "#000000");
  const [textBgOpacity, setTextBgOpacity] = useState(editingMeta.bgOpacity ?? 55);
  const [textBorderRadius, setTextBorderRadius] =
    useState<TextHotspotMetadata["borderRadius"]>(editingMeta.borderRadius ?? "md");
  const [textAnimation, setTextAnimation] = useState<TextHotspotMetadata["animation"]>(
    editingMeta.animation ?? "glow"
  );

  const [saving, setSaving] = useState(false);
  const isEditing = !!editing;

  async function handleSave() {
    if (!position && !editing) return;
    setSaving(true);
    try {
      if (type === "text") {
        if (!textContent.trim()) {
          toast.error("Metin içeriği boş bırakılamaz.");
          return;
        }
        const metadata: TextHotspotMetadata = {
          content: textContent,
          fontSize: textFontSize,
          fontWeight: textFontWeight,
          color: textColor,
          bgColor: textBgColor,
          bgOpacity: textBgOpacity,
          borderRadius: textBorderRadius,
          animation: textAnimation,
        };

        const res = isEditing
          ? await fetch(`/api/hotspots/${editing.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ metadata }),
            })
          : await fetch("/api/hotspots", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                panoramaId,
                type: "text",
                yaw: position!.yaw,
                pitch: position!.pitch,
                metadata,
              }),
            });

        if (!res.ok) {
          const { error } = await res.json();
          toast.error(error?.message ?? "Hotspot kaydedilemedi.");
          return;
        }
        toast.success(isEditing ? "Hotspot güncellendi." : "Hotspot eklendi.");
        onSaved();
        onClose();
        return;
      }

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
            targetPanoramaId:
              type === "link" || type === "pin" ? targetPanoramaId : undefined,
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Hotspot Düzenle" : "Hotspot Ekle"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type selector — only when creating */}
          {!isEditing && (
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { value: "info", label: "ℹ Bilgi" },
                  { value: "link", label: "↗ Geçiş" },
                  { value: "pin", label: "📍 Pin" },
                  { value: "text", label: "T Yazı" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    type === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Link / Pin: target panorama */}
          {(type === "link" || type === "pin") && (
            <div className="space-y-1.5">
              <Label>Hedef Panorama</Label>
              <select
                value={targetPanoramaId}
                onChange={(e) => setTargetPanoramaId(e.target.value)}
                className={selectCls}
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

          {/* Info / Link / Pin: title */}
          {type !== "text" && (
            <div className="space-y-1.5">
              <Label>
                {type === "info" ? "Başlık" : "Etiket (opsiyonel)"}
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === "info" ? "Hotspot başlığı…" : "Pin etiketi…"
                }
                maxLength={100}
              />
            </div>
          )}

          {/* Info: description */}
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

          {/* Text: full settings panel */}
          {type === "text" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Metin İçeriği</Label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Panoramada görünecek metin…"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  Font: Playfair Display · Maks. 200 karakter
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Boyut</Label>
                  <select
                    value={textFontSize}
                    onChange={(e) =>
                      setTextFontSize(e.target.value as typeof textFontSize)
                    }
                    className={selectCls}
                  >
                    <option value="sm">Küçük (13px)</option>
                    <option value="md">Orta (17px)</option>
                    <option value="lg">Büyük (22px)</option>
                    <option value="xl">X-Büyük (30px)</option>
                    <option value="2xl">XX-Büyük (40px)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Kalınlık</Label>
                  <select
                    value={textFontWeight}
                    onChange={(e) =>
                      setTextFontWeight(e.target.value as typeof textFontWeight)
                    }
                    className={selectCls}
                  >
                    <option value="normal">Normal</option>
                    <option value="semibold">Yarı Kalın</option>
                    <option value="bold">Kalın</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Yazı Rengi</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-9 h-9 rounded-md border border-border cursor-pointer bg-transparent p-0.5 shrink-0"
                    />
                    <span className="text-xs text-muted-foreground font-mono">
                      {textColor}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Arka Plan Rengi</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textBgColor}
                      onChange={(e) => setTextBgColor(e.target.value)}
                      className="w-9 h-9 rounded-md border border-border cursor-pointer bg-transparent p-0.5 shrink-0"
                    />
                    <span className="text-xs text-muted-foreground font-mono">
                      {textBgColor}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Arka Plan Opaklığı</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {textBgOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={textBgOpacity}
                  onChange={(e) => setTextBgOpacity(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Köşe</Label>
                  <select
                    value={textBorderRadius}
                    onChange={(e) =>
                      setTextBorderRadius(
                        e.target.value as typeof textBorderRadius
                      )
                    }
                    className={selectCls}
                  >
                    <option value="none">Kare</option>
                    <option value="sm">Az Yuvarlak</option>
                    <option value="md">Yuvarlak</option>
                    <option value="lg">Çok Yuvarlak</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Animasyon</Label>
                  <select
                    value={textAnimation}
                    onChange={(e) =>
                      setTextAnimation(e.target.value as typeof textAnimation)
                    }
                    className={selectCls}
                  >
                    <option value="none">Yok</option>
                    <option value="fade">Solma</option>
                    <option value="glow">Parıldama ✨</option>
                    <option value="float">Yüzme 〰</option>
                  </select>
                </div>
              </div>
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
