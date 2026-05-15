"use client";

import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Map } from "lucide-react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
import { AutorotatePlugin } from "@photo-sphere-viewer/autorotate-plugin";
import { cn } from "@/lib/utils";

export interface ViewerHotspot {
  id: string;
  type: "link" | "info" | "pin";
  yaw: number;
  pitch: number;
  title?: string | null;
  description?: string | null;
  targetPanoramaId?: string | null;
}

export interface ViewerPanorama {
  id: string;
  title: string;
  panoramaUrl: string;
  thumbnailUrl?: string | null;
  defaultYaw?: number | null;
  defaultPitch?: number | null;
  defaultZoom?: number | null;
  hotspots: ViewerHotspot[];
}

export interface PanoramaViewerProps {
  panoramas: ViewerPanorama[];
  initialId?: string;
  className?: string;
  showNavbar?: boolean;
  showThumbnailNav?: boolean;
  overviewPanoramaId?: string | null;
  onPanoramaChange?: (id: string) => void;
  onCameraChange?: (yaw: number, pitch: number, zoom: number) => void;
  onSceneClick?: (yaw: number, pitch: number) => void;
  onMarkerClick?: (hotspot: ViewerHotspot) => void;
}

function buildNodes(panoramas: ViewerPanorama[]) {
  return panoramas.map((p) => ({
    id: p.id,
    panorama: p.panoramaUrl,
    name: p.title,
    thumbnail: p.thumbnailUrl ?? undefined,
    links: p.hotspots
      .filter((h) => h.type === "link" && h.targetPanoramaId)
      .map((h) => ({
        nodeId: h.targetPanoramaId!,
        position: { yaw: h.yaw, pitch: h.pitch },
        name: h.title ?? undefined,
      })),
    markers: p.hotspots
      .filter((h) => h.type === "info" || h.type === "pin")
      .map((h) => {
        if (h.type === "pin") {
          const label = (h.title ?? "Geçiş").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          return {
            id: h.id,
            position: { yaw: h.yaw, pitch: h.pitch },
            html: `<div class="d360-nav-pin">
              <div class="d360-nav-pin__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
              <span class="d360-nav-pin__label">${label}</span>
            </div>`,
            size: { width: 120, height: 64 },
            anchor: "bottom center" as const,
            data: h,
          };
        }
        return {
          id: h.id,
          position: { yaw: h.yaw, pitch: h.pitch },
          html: `<div class="d360-info-marker" aria-label="${h.title ?? "Bilgi"}">i</div>`,
          size: { width: 40, height: 40 },
          anchor: "center center" as const,
          data: h,
        };
      }),
  }));
}

export function PanoramaViewer({
  panoramas,
  initialId,
  className,
  showNavbar = true,
  showThumbnailNav = false,
  overviewPanoramaId,
  onPanoramaChange,
  onCameraChange,
  onSceneClick,
  onMarkerClick,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const vtRef = useRef<VirtualTourPlugin | null>(null);
  const initializedRef = useRef(false);
  const callbacksRef = useRef({ onPanoramaChange, onCameraChange, onSceneClick, onMarkerClick });
  const activeThumbnailRef = useRef<HTMLButtonElement | null>(null);
  const [activeId, setActiveId] = useState<string>(
    panoramas.find((p) => p.id === initialId)?.id ?? panoramas[0]?.id ?? ""
  );
  const [infoCard, setInfoCard] = useState<{ title: string; description?: string | null } | null>(null);

  // Keep callbacks ref in sync without re-running the init effect
  useEffect(() => {
    callbacksRef.current = { onPanoramaChange, onCameraChange, onSceneClick, onMarkerClick };
  });

  // Init once on mount.
  // setTimeout is intentional: React StrictMode runs effect → cleanup → effect again.
  // The cleanup clears the timer before it fires on the first (discarded) invocation,
  // so PSV only initialises once and never hits the destroy-mid-loadNode crash.
  useEffect(() => {
    if (!containerRef.current || panoramas.length === 0) return;

    const startPano = panoramas.find((p) => p.id === initialId) ?? panoramas[0];
    const container = containerRef.current;
    let viewer: Viewer | null = null;

    const timerId = setTimeout(() => {
      if (!container.isConnected) return;

      viewer = new Viewer({
        container,
        // panorama is intentionally omitted — VirtualTourPlugin loads it via startNodeId.
        // Passing panorama here AND startNodeId causes two concurrent setPanorama calls
        // that race each other and the stale-load guard abandons the actual load.
        defaultYaw: startPano.defaultYaw ?? 0,
        defaultPitch: startPano.defaultPitch ?? 0,
        defaultZoomLvl: startPano.defaultZoom ?? 50,
        navbar: showNavbar
          ? (["autorotate", "zoom", "move", "gyroscope", "fullscreen"] as never)
          : (false as never),
        touchmoveTwoFingers: false,
        plugins: [
          MarkersPlugin,
          [
            VirtualTourPlugin,
            {
              dataMode: "client",
              renderMode: "3d",
              nodes: buildNodes(panoramas),
              startNodeId: startPano.id,
            },
          ],
          GyroscopePlugin,
          [AutorotatePlugin, { autostartDelay: 2000 }],
        ],
      });

      viewerRef.current = viewer;
      const vt = viewer.getPlugin(VirtualTourPlugin) as VirtualTourPlugin;
      vtRef.current = vt;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vt.addEventListener("node-changed" as never, (e: any) => {
        initializedRef.current = true;
        setActiveId(e.node.id);
        setInfoCard(null);
        callbacksRef.current.onPanoramaChange?.(e.node.id);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      viewer.addEventListener("position-updated" as never, (e: any) => {
        const zoom = (viewer as Viewer).getZoomLevel();
        callbacksRef.current.onCameraChange?.(e.position.yaw, e.position.pitch, zoom);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      viewer.addEventListener("click" as never, (e: any) => {
        if (!e.data?.rightclick) {
          callbacksRef.current.onSceneClick?.(e.data.yaw, e.data.pitch);
        }
      });

      const markers = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      markers.addEventListener("select-marker" as never, (e: any) => {
        const hotspot = e.marker?.data as ViewerHotspot | undefined;
        if (hotspot) {
          if (hotspot.type === "pin" && hotspot.targetPanoramaId) {
            (vtRef.current as unknown as { setCurrentNode?: (id: string) => void } | null)
              ?.setCurrentNode?.(hotspot.targetPanoramaId);
          } else if (hotspot.type === "info") {
            setInfoCard({ title: hotspot.title ?? "", description: hotspot.description });
          }
          callbacksRef.current.onMarkerClick?.(hotspot);
        }
      });

    }, 0);

    return () => {
      clearTimeout(timerId);
      if (viewer) {
        initializedRef.current = false;
        viewer.destroy();
        viewerRef.current = null;
        vtRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync nodes when panoramas prop changes (hotspots added/removed).
  // Guard with initializedRef so this never fires before the first node-changed.
  useEffect(() => {
    const vt = vtRef.current;
    if (!vt || !initializedRef.current) return;
    const currentId = (vt as unknown as { currentNode?: { id: string } }).currentNode?.id;
    vt.setNodes(buildNodes(panoramas) as never, currentId);
  }, [panoramas]);

  // Auto-scroll the active thumbnail into view
  useEffect(() => {
    activeThumbnailRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeId]);

  function navigateTo(id: string) {
    (vtRef.current as unknown as { setCurrentNode?: (id: string) => void } | null)
      ?.setCurrentNode?.(id);
  }

  const showNav = showThumbnailNav && panoramas.length > 1;

  // Overview panorama pinned first, rest in original order
  const navPanoramas = overviewPanoramaId
    ? [
        ...panoramas.filter((p) => p.id === overviewPanoramaId),
        ...panoramas.filter((p) => p.id !== overviewPanoramaId),
      ]
    : panoramas;

  return (
    <div ref={containerRef} className={className ?? "w-full h-full"}>
      {/* Info card — shown when an info marker is tapped/clicked */}
      {infoCard && (
        <div
          className="absolute inset-0 z-[200] flex items-center justify-center p-6 pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-sm rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-1">
              {infoCard.title && (
                <h3 className="text-white font-semibold text-base leading-snug">
                  {infoCard.title}
                </h3>
              )}
              <button
                type="button"
                onClick={() => setInfoCard(null)}
                className="shrink-0 size-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            {infoCard.description && (
              <p className="text-white/75 text-sm leading-relaxed mt-2">
                {infoCard.description}
              </p>
            )}
          </div>
        </div>
      )}

      {showNav && (
        <div
          className="absolute left-0 right-0 z-[100] pointer-events-none"
          style={{ bottom: showNavbar ? 48 : 0 }}
        >
          <div className="px-3 py-3">
            <div
              className="flex gap-2 overflow-x-auto pointer-events-auto justify-center py-2"
              style={{ scrollbarWidth: "none" } as React.CSSProperties}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {navPanoramas.map((p) => {
                const isActive = p.id === activeId;
                const isOverview = p.id === overviewPanoramaId;
                return (
                  <button
                    key={p.id}
                    ref={isActive ? (el) => { activeThumbnailRef.current = el; } : undefined}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigateTo(p.id); }}
                    className={cn(
                      "shrink-0 rounded-lg overflow-hidden transition-all duration-200 ring-2",
                      isActive
                        ? "ring-primary opacity-100 scale-105"
                        : "ring-white/20 opacity-55 hover:opacity-90 hover:ring-white/40"
                    )}
                  >
                    <div className="w-24 h-[54px] relative bg-black/50">
                      {p.thumbnailUrl ? (
                        <Image
                          src={p.thumbnailUrl}
                          alt={p.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="size-4 text-white/30" />
                        </div>
                      )}
                      {isOverview && (
                        <div className="absolute top-1 right-1 rounded bg-sky-500/90 p-0.5">
                          <Map className="size-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="bg-black/75 px-2 py-1">
                      <p className="text-white text-[10px] font-medium truncate leading-tight w-20">
                        {p.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
