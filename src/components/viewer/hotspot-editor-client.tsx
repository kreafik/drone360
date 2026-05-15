"use client";

import dynamic from "next/dynamic";
import type { ViewerPanorama } from "./panorama-viewer";

const HotspotEditor = dynamic(
  () => import("./hotspot-editor").then((m) => m.HotspotEditor),
  { ssr: false }
);

interface Props {
  panoramas: ViewerPanorama[];
  projectId: string;
}

export function HotspotEditorClient(props: Props) {
  return <HotspotEditor {...props} />;
}
