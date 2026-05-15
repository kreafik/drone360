"use client";

import { useEffect, useRef, useState } from "react";
import { PanoramaViewerClient } from "./panorama-viewer-no-ssr";
import type { PanoramaViewerProps, ViewerHotspot } from "./panorama-viewer";
import { startSession, trackEvent } from "@/lib/analytics/tracker";

interface AnalyticsViewerProps extends PanoramaViewerProps {
  projectId: string;
  shareId?: string | null;
}

export function AnalyticsViewer({
  projectId,
  shareId,
  ...viewerProps
}: AnalyticsViewerProps) {
  const firstPanoramaId = viewerProps.panoramas[0]?.id ?? null;
  const firstFired = useRef(false);
  const [, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    const cleanup = startSession(projectId, shareId, firstPanoramaId);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePanoramaChange(id: string) {
    setCurrentId(id);
    if (!firstFired.current) {
      firstFired.current = true;
      return; // initial node-change is part of view_start, don't double-count
    }
    trackEvent("panorama_change", { panoramaId: id });
    viewerProps.onPanoramaChange?.(id);
  }

  function handleMarkerClick(hotspot: ViewerHotspot) {
    trackEvent("hotspot_click", { hotspotId: hotspot.id });
    viewerProps.onMarkerClick?.(hotspot);
  }

  return (
    <PanoramaViewerClient
      {...viewerProps}
      onPanoramaChange={handlePanoramaChange}
      onMarkerClick={handleMarkerClick}
    />
  );
}
