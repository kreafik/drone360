"use client";

import dynamic from "next/dynamic";
import type { PanoramaViewerProps } from "./panorama-viewer";

export type { ViewerHotspot, ViewerPanorama, PanoramaViewerProps } from "./panorama-viewer";

export const PanoramaViewerNoSSR = dynamic(
  () => import("./panorama-viewer").then((m) => m.PanoramaViewer),
  { ssr: false }
);

export default PanoramaViewerNoSSR;

// Re-export a typed version for convenience
export function PanoramaViewerClient(props: PanoramaViewerProps) {
  return <PanoramaViewerNoSSR {...props} />;
}
