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
}

export function PanoramaListClient({ projectId, initialPanoramas }: Props) {
  return <PanoramaList projectId={projectId} initialPanoramas={initialPanoramas} />;
}
