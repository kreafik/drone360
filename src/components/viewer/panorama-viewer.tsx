"use client";

import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";
import { ImageIcon, Map } from "lucide-react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
import { AutorotatePlugin } from "@photo-sphere-viewer/autorotate-plugin";
import { cn } from "@/lib/utils";
import type { TextHotspotMetadata, AreaHotspotMetadata } from "@/types/domain";

export interface ViewerHotspot {
  id: string;
  type: "link" | "info" | "pin" | "text" | "area" | "floor";
  yaw: number;
  pitch: number;
  title?: string | null;
  description?: string | null;
  targetPanoramaId?: string | null;
  metadata?: Record<string, unknown>;
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

export interface PanoramaViewerHandle {
  goTo: (id: string) => void;
}

export interface PanoramaViewerProps {
  panoramas: ViewerPanorama[];
  initialId?: string;
  className?: string;
  showNavbar?: boolean;
  showThumbnailNav?: boolean;
  autorotate?: boolean;
  overviewPanoramaId?: string | null;
  onPanoramaChange?: (id: string) => void;
  onCameraChange?: (yaw: number, pitch: number, zoom: number) => void;
  onSceneClick?: (yaw: number, pitch: number) => void;
  onMarkerClick?: (hotspot: ViewerHotspot) => void;
}

function buildTextMarkerHtml(h: ViewerHotspot): string {
  const meta = (h.metadata ?? {}) as Partial<TextHotspotMetadata>;
  const fontSizeMap: Record<string, number> = { sm: 13, md: 17, lg: 22, xl: 30, "2xl": 40 };
  const fontWeightMap: Record<string, number> = { normal: 400, semibold: 600, bold: 700 };
  const radiusMap: Record<string, number> = { none: 0, sm: 6, md: 12, lg: 20 };

  const raw = meta.content ?? h.title ?? "";
  const content = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  const fs = fontSizeMap[meta.fontSize ?? "md"] ?? 17;
  const fw = fontWeightMap[meta.fontWeight ?? "normal"] ?? 400;
  const color = meta.color ?? "#ffffff";
  const bgHex = meta.bgColor ?? "#000000";
  const bgOpacity = (meta.bgOpacity ?? 55) / 100;
  const radius = radiusMap[meta.borderRadius ?? "md"] ?? 12;
  const animClass = meta.animation && meta.animation !== "none" ? ` d360-text-anim-${meta.animation}` : "";

  const r = parseInt(bgHex.slice(1, 3), 16) || 0;
  const g = parseInt(bgHex.slice(3, 5), 16) || 0;
  const b = parseInt(bgHex.slice(5, 7), 16) || 0;

  const strokeWidth = meta.strokeWidth ?? 0;
  const strokeColor = meta.strokeColor ?? "#000000";
  const strokeStyle = strokeWidth > 0
    ? `-webkit-text-stroke:${strokeWidth}px ${strokeColor};paint-order:stroke fill;`
    : "";

  return `<div class="d360-text-marker${animClass}" style="font-size:${fs}px;font-weight:${fw};color:${color};background:rgba(${r},${g},${b},${bgOpacity});border-radius:${radius}px;${strokeStyle}">${content}</div>`;
}

const AREA_STATUS_LABELS: Record<string, string> = {
  satilik: "Satılık",
  kiralik: "Kiralık",
  opsiyonda: "Opsiyonda",
};
const AREA_STATUS_COLORS: Record<string, string> = {
  satilik: "16,185,129",
  kiralik: "14,165,233",
  opsiyonda: "245,158,11",
};

function buildAreaMarkerHtml(h: ViewerHotspot): string {
  const meta = (h.metadata ?? {}) as Partial<AreaHotspotMetadata>;
  const status = meta.status ?? "satilik";
  const label = (meta.label ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const size = meta.size ?? "md";
  const animClass = meta.animation !== "none" ? " d360-area-anim-pulse" : "";
  const colorRGB = AREA_STATUS_COLORS[status] ?? "16,185,129";
  const statusLabel = AREA_STATUS_LABELS[status] ?? "Satılık";

  return `<div class="d360-area-marker d360-area-${size}${animClass}" style="--c:${colorRGB};">
    <div class="d360-area-marker__badge">${statusLabel}</div>
    ${label ? `<div class="d360-area-marker__label">${label}</div>` : ""}
  </div>`;
}

function buildFloorMarkerHtml(h: ViewerHotspot): string {
  const label = (h.title ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div class="d360-floor-marker">
    <div class="d360-floor-marker__circle">
      <span class="d360-floor-marker__icon">&#8593;</span>
    </div>
    ${label ? `<span class="d360-floor-marker__label">${label}</span>` : ""}
  </div>`;
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
      .filter((h) => h.type === "info" || h.type === "pin" || h.type === "text" || h.type === "area" || h.type === "floor")
      .map((h) => {
        if (h.type === "pin") {
          const label = (h.title ?? "Geçiş").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const targetPano = panoramas.find((p) => p.id === h.targetPanoramaId);
          const thumbUrl = targetPano?.thumbnailUrl ?? "";
          const thumbContent = thumbUrl
            ? `<img src="${thumbUrl}" class="d360-nav-pin__thumb" alt="" />`
            : `<div class="d360-nav-pin__no-thumb">&#8594;</div>`;
          return {
            id: h.id,
            position: { yaw: h.yaw, pitch: h.pitch },
            html: `<div class="d360-nav-pin">
              <div class="d360-nav-pin__bubble">
                ${thumbContent}
                <div class="d360-nav-pin__gloss"></div>
                <span class="d360-nav-pin__label">${label}</span>
              </div>
              <div class="d360-nav-pin__tail"></div>
            </div>`,
            size: { width: 82, height: 90 },
            anchor: "bottom center" as const,
            data: h,
          };
        }
        if (h.type === "text") {
          return {
            id: h.id,
            position: { yaw: h.yaw, pitch: h.pitch },
            html: buildTextMarkerHtml(h),
            anchor: "center center" as const,
            data: h,
          };
        }
        if (h.type === "area") {
          return {
            id: h.id,
            position: { yaw: h.yaw, pitch: h.pitch },
            html: buildAreaMarkerHtml(h),
            anchor: "bottom center" as const,
            data: h,
          };
        }
        if (h.type === "floor") {
          return {
            id: h.id,
            position: { yaw: h.yaw, pitch: h.pitch },
            html: buildFloorMarkerHtml(h),
            anchor: "center center" as const,
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

export const PanoramaViewer = forwardRef<PanoramaViewerHandle, PanoramaViewerProps>(function PanoramaViewer({
  panoramas,
  initialId,
  className,
  showNavbar = true,
  showThumbnailNav = false,
  autorotate = true,
  overviewPanoramaId,
  onPanoramaChange,
  onCameraChange,
  onSceneClick,
  onMarkerClick,
}: PanoramaViewerProps, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const vtRef = useRef<VirtualTourPlugin | null>(null);
  const initializedRef = useRef(false);
  const callbacksRef = useRef({ onPanoramaChange, onCameraChange, onSceneClick, onMarkerClick });
  const activeThumbnailRef = useRef<HTMLButtonElement | null>(null);
  const panoramasRef = useRef(panoramas);
  const [activeId, setActiveId] = useState<string>(
    panoramas.find((p) => p.id === initialId)?.id ?? panoramas[0]?.id ?? ""
  );
  const activeIdRef = useRef(activeId);
  const preloadStartedRef = useRef(false);
  const preloadAbortRef = useRef<AbortController | null>(null);
  const [infoCard, setInfoCard] = useState<{ title: string; description?: string | null } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Keep callbacks ref in sync without re-running the init effect
  useEffect(() => {
    callbacksRef.current = { onPanoramaChange, onCameraChange, onSceneClick, onMarkerClick };
  });

  // Keep panoramasRef in sync for the monkey-patched setCurrentNode
  useEffect(() => {
    panoramasRef.current = panoramas;
  }, [panoramas]);

  // Keep activeIdRef in sync so the setNodes effect always has the latest value
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

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
              transitionOptions: {
                showLoader: false,
                speed: "3rpm",
                effect: "black",
                rotation: true,
              },
            },
          ],
          GyroscopePlugin,
          ...(autorotate ? [[AutorotatePlugin, { autostartDelay: 2000 }] as never] : []),
        ],
      });

      viewerRef.current = viewer;
      const vt = viewer.getPlugin(VirtualTourPlugin) as VirtualTourPlugin;

      // Intercept ALL setCurrentNode calls (arrows, pins, thumbnail nav, goTo)
      // to show the loading overlay before any navigation begins.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const origSetCurrentNode = (vt as any).setCurrentNode.bind(vt);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (vt as any).setCurrentNode = (nodeId: string, ...args: unknown[]) => {
        if (initializedRef.current) setIsTransitioning(true);
        // Abort any in-flight background preload so its large fetch doesn't compete
        // with PSV's own fetch for the panorama the user just navigated to.
        preloadAbortRef.current?.abort();
        preloadAbortRef.current = null;
        return origSetCurrentNode(nodeId, ...args);
      };

      vtRef.current = vt;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vt.addEventListener("node-changed" as never, (e: any) => {
        const prevId = activeIdRef.current;
        const newId = e.node.id as string;

        initializedRef.current = true;
        activeIdRef.current = newId;
        setActiveId(newId);
        setInfoCard(null);
        setIsTransitioning(false);
        callbacksRef.current.onPanoramaChange?.(newId);

        // After the first panorama loads, silently preload remaining panoramas
        // one by one using fetch() — same infrastructure as Three.js FileLoader,
        // so the HTTP cache entry is shared and PSV finds the image instantly.
        // The AbortController lets setCurrentNode cancel an in-flight preload
        // so its large download doesn't compete with PSV's own navigation fetch.
        if (!preloadStartedRef.current && panoramasRef.current.length > 1) {
          preloadStartedRef.current = true;
          const otherUrls = panoramasRef.current
            .filter((p) => p.id !== newId)
            .map((p) => p.panoramaUrl);
          const controller = new AbortController();
          preloadAbortRef.current = controller;
          (async () => {
            for (const url of otherUrls) {
              if (controller.signal.aborted) break;
              await fetch(url, { mode: "cors", signal: controller.signal })
                .then((r) => r.blob())
                .catch(() => {});
            }
            preloadAbortRef.current = null;
          })();
        }

        // Apply saved default camera view when navigating to a different panorama.
        // Skip when setNodes reloads the current node (newId === prevId) to avoid
        // resetting the camera while the user is browsing.
        if (newId !== prevId && viewer) {
          const pano = panoramasRef.current.find((p) => p.id === newId);
          if (pano && (pano.defaultYaw != null || pano.defaultPitch != null || pano.defaultZoom != null)) {
            viewer.animate({
              yaw: pano.defaultYaw ?? 0,
              pitch: pano.defaultPitch ?? 0,
              zoom: pano.defaultZoom ?? 50,
              speed: "4rpm",
            });
          }
        }
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
          } else if (hotspot.type === "area") {
            const meta = (hotspot.metadata ?? {}) as Record<string, unknown>;
            const statusLabel = AREA_STATUS_LABELS[(meta.status as string) ?? "satilik"] ?? "Satılık";
            const label = meta.label as string | undefined;
            setInfoCard({
              title: label ? `${statusLabel} — ${label}` : statusLabel,
              description: (meta.description as string | null | undefined) ?? null,
            });
          } else if (hotspot.type === "floor" && hotspot.targetPanoramaId) {
            const targetId = hotspot.targetPanoramaId;
            // Animate camera to look toward the floor hotspot, then transition to target panorama
            viewer?.animate({
              yaw: hotspot.yaw,
              pitch: hotspot.pitch,
              zoom: 75,
              speed: "6rpm",
            }).then(() => {
              (vtRef.current as unknown as { setCurrentNode?: (id: string) => void } | null)
                ?.setCurrentNode?.(targetId);
            });
          }
          callbacksRef.current.onMarkerClick?.(hotspot);
        }
      });

    }, 0);

    return () => {
      clearTimeout(timerId);
      preloadAbortRef.current?.abort();
      preloadAbortRef.current = null;
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
  // activeIdRef is used instead of vt.currentNode?.id to avoid a timing window
  // where currentNode is transiently undefined, which would cause PSV to fall
  // back to the first node and navigate away from the current panorama.
  useEffect(() => {
    const vt = vtRef.current;
    if (!vt || !initializedRef.current) return;
    const currentId =
      activeIdRef.current ||
      (vt as unknown as { currentNode?: { id: string } }).currentNode?.id;
    if (!currentId) return;
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

  useImperativeHandle(ref, () => ({ goTo: navigateTo }));

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
      {/* Top loading bar — shown during panorama transitions */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-[500] overflow-hidden pointer-events-none"
        style={{
          opacity: isTransitioning ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          className="absolute top-0 h-full w-[45%]"
          style={{
            background: "oklch(0.78 0.16 70)",
            boxShadow: "0 0 8px 1px oklch(0.78 0.16 70 / 0.6)",
            animation: "d360-topbar 1.1s ease-in-out infinite",
          }}
        />
      </div>

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
              className="overflow-x-auto pointer-events-auto py-2"
              style={{ scrollbarWidth: "none" } as React.CSSProperties}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex gap-2 w-max mx-auto px-1">
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
        </div>
      )}
    </div>
  );
});
