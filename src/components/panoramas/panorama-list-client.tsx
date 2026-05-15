"use client";

import dynamic from "next/dynamic";
import type { PanoramaItem } from "./panorama-list";

const PanoramaList = dynamic(
  () => import("./panorama-list").then((m) => m.PanoramaList),
  { ssr: false }
);

interface Props {
  projectId: string;
  initialPanoramas: PanoramaItem[];
  initialCoverPanoramaId?: string | null;
}

export function PanoramaListClient({ projectId, initialPanoramas, initialCoverPanoramaId }: Props) {
  return (
    <PanoramaList
      projectId={projectId}
      initialPanoramas={initialPanoramas}
      initialCoverPanoramaId={initialCoverPanoramaId}
    />
  );
}
