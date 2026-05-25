"use client";

import dynamic from "next/dynamic";
import type { ViewerPanorama } from "@/components/viewer/panorama-viewer";

const PanoramaViewerNoSSR = dynamic(
  () => import("@/components/viewer/panorama-viewer").then((m) => m.PanoramaViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-xs text-muted-foreground tracking-wider">Panorama yükleniyor…</p>
        </div>
      </div>
    ),
  }
);

const DEMO_PANORAMA: ViewerPanorama = {
  id: "demo",
  title: "Örnek — Hava Panoraması",
  panoramaUrl: "https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg",
  hotspots: [
    {
      id: "h1",
      type: "info",
      yaw: 0.8,
      pitch: 0.05,
      title: "Kuzey Cephesi",
      description: "Ana cephe. Toplam alan: 320 m²",
    },
    {
      id: "h2",
      type: "area",
      yaw: -1.2,
      pitch: -0.1,
      title: "Bahçe",
      metadata: {
        label: "Özel Bahçe — 180 m²",
        status: "satilik",
        size: "md",
        animation: "pulse",
      },
    },
  ],
};

export function LandingDemo() {
  return (
    <PanoramaViewerNoSSR
      panoramas={[DEMO_PANORAMA]}
      autorotate
      showNavbar={false}
      className="w-full h-full"
    />
  );
}
