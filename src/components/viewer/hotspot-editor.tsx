"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Save, ImageIcon, Info, ArrowRight, MapPin, Plus, Type, Square, CircleDot, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HotspotForm } from "./hotspot-form";
import type { ViewerPanorama, ViewerHotspot, PanoramaViewerHandle } from "./panorama-viewer";

const PanoramaViewerNoSSR = dynamic(
  () => import("./panorama-viewer").then((m) => m.PanoramaViewer),
  { ssr: false }
);

interface HotspotEditorProps {
  panoramas: ViewerPanorama[];
  projectId?: string;
}

export function HotspotEditor({ panoramas }: HotspotEditorProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const viewerRef = useRef<PanoramaViewerHandle>(null);
  const [currentPanoId, setCurrentPanoId] = useState(panoramas[0]?.id ?? "");
  const [pendingPos, setPendingPos] = useState<{ yaw: number; pitch: number } | null>(null);
  const [editingHotspot, setEditingHotspot] = useState<ViewerHotspot | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [camera, setCamera] = useState<{ yaw: number; pitch: number; zoom: number } | null>(null);
  const [savingView, setSavingView] = useState(false);

  const currentPano = panoramas.find((p) => p.id === currentPanoId);

  const handleSceneClick = useCallback((yaw: number, pitch: number) => {
    setPendingPos({ yaw, pitch });
    setEditingHotspot(null);
    setFormOpen(true);
  }, []);

  const handleMarkerClick = useCallback((hotspot: ViewerHotspot) => {
    setEditingHotspot(hotspot);
    setPendingPos(null);
    setFormOpen(true);
  }, []);

  const handleSaved = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  async function handleDeleteHotspot(id: string) {
    const res = await fetch(`/api/hotspots/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Hotspot silindi.");
      startTransition(() => { router.refresh(); });
    } else {
      toast.error("Hotspot silinemedi.");
    }
  }

  async function handleSaveDefaultView() {
    if (!camera || !currentPanoId) return;
    setSavingView(true);
    const res = await fetch(`/api/panoramas/${currentPanoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultYaw: camera.yaw,
        defaultPitch: camera.pitch,
        defaultZoom: camera.zoom,
      }),
    });
    setSavingView(false);
    if (res.ok) {
      toast.success("Varsayılan görünüm kaydedildi.");
    } else {
      toast.error("Kaydedilemedi.");
    }
  }

  if (panoramas.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <ImageIcon className="size-10 text-subtle mb-3" strokeWidth={1.5} />
        <p className="text-muted-foreground text-sm">Hotspot eklemek için önce panorama yükleyin.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">
      {/* Viewer area */}
      <div className="flex-1 flex flex-col gap-2 min-h-[400px] lg:min-h-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Hotspot eklemek için sahneye tıklayın</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDefaultView}
            disabled={savingView || !camera}
          >
            <Save className="size-3.5" />
            {savingView ? "Kaydediliyor…" : "Görünümü Kaydet"}
          </Button>
        </div>

        <div className="relative flex-1 rounded-xl overflow-hidden border border-border min-h-[400px]">
          <PanoramaViewerNoSSR
            ref={viewerRef}
            panoramas={panoramas}
            initialId={currentPanoId}
            className="w-full h-full absolute inset-0"
            autorotate={false}
            onPanoramaChange={setCurrentPanoId}
            onCameraChange={(yaw, pitch, zoom) => setCamera({ yaw, pitch, zoom })}
            onSceneClick={handleSceneClick}
            onMarkerClick={handleMarkerClick}
          />
        </div>

        {/* Panorama mini-selector */}
        {panoramas.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {panoramas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setCurrentPanoId(p.id); viewerRef.current?.goTo(p.id); }}
                className={`shrink-0 relative rounded-lg overflow-hidden border-2 transition-colors ${
                  p.id === currentPanoId ? "border-primary" : "border-transparent"
                }`}
              >
                {p.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnailUrl} alt={p.title} className="w-20 h-12 object-cover" />
                ) : (
                  <div className="w-20 h-12 bg-surface-elevated flex items-center justify-center">
                    <ImageIcon className="size-4 text-subtle" />
                  </div>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] truncate px-1">
                  {p.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hotspot list sidebar */}
      <div className="w-full lg:w-64 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {currentPano?.title ?? "Panorama"} — Hotspotlar
          </h3>
          <button
            type="button"
            onClick={() => {
              setPendingPos({ yaw: 0, pitch: 0 });
              setEditingHotspot(null);
              setFormOpen(true);
            }}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="size-3" /> Ekle
          </button>
        </div>

        {currentPano && currentPano.hotspots.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Henüz hotspot yok. Sahneye tıklayarak ekleyin.
          </p>
        )}

        <ul className="space-y-1.5">
          {currentPano?.hotspots.map((h) => (
            <li
              key={h.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2 text-sm"
            >
              <span className="shrink-0 text-muted-foreground">
                {h.type === "info" ? (
                  <Info className="size-3.5" />
                ) : h.type === "pin" ? (
                  <MapPin className="size-3.5 text-amber-400" />
                ) : h.type === "text" ? (
                  <Type className="size-3.5 text-violet-400" />
                ) : h.type === "area" ? (
                  <Square className="size-3.5 text-emerald-400" />
                ) : h.type === "floor" ? (
                  <CircleDot className="size-3.5 text-sky-400" />
                ) : h.type === "direction" ? (
                  <Navigation className="size-3.5 text-teal-400" />
                ) : (
                  <ArrowRight className="size-3.5" />
                )}
              </span>
              <span className="flex-1 min-w-0 truncate">
                {h.type === "text"
                  ? (((h.metadata as Record<string, unknown> | undefined)?.content as string | undefined)?.slice(0, 24) ?? "Yazı")
                  : h.type === "area"
                  ? (() => {
                      const m = (h.metadata ?? {}) as Record<string, unknown>;
                      const s: Record<string, string> = { satilik: "Satılık", kiralik: "Kiralık", opsiyonda: "Opsiyonda" };
                      const status = s[(m.status as string) ?? "satilik"] ?? "Satılık";
                      const lbl = m.label as string | undefined;
                      return lbl ? `${status} — ${lbl}` : status;
                    })()
                  : (h.title ?? (h.type === "link" ? "Geçiş" : h.type === "pin" ? "Sabit Pin" : h.type === "floor" ? "Zemin Geçiş" : h.type === "direction" ? "Yön" : "Bilgi"))}
              </span>
              <button
                type="button"
                onClick={() => handleDeleteHotspot(h.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Hotspot form dialog */}
      {formOpen && (
        <HotspotForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setPendingPos(null); setEditingHotspot(null); }}
          onSaved={handleSaved}
          panoramaId={currentPanoId}
          allPanoramas={panoramas}
          position={pendingPos ?? undefined}
          editing={editingHotspot ?? undefined}
        />
      )}
    </div>
  );
}
