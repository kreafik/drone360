export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  type: "real_estate" | "boat" | "other";
  status: "draft" | "published" | "archived";
  coverUrl: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Panorama {
  id: string;
  projectId: string;
  title: string;
  position: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  defaultYaw: number;
  defaultPitch: number;
  defaultZoom: number;
  status: "uploading" | "processing" | "ready" | "failed";
  hotspots?: Hotspot[];
}

export interface Hotspot {
  id: string;
  panoramaId: string;
  type: "link" | "info" | "pin" | "text" | "area" | "floor";
  yaw: number;
  pitch: number;
  targetPanoramaId: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  icon: string;
  color: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AreaHotspotMetadata {
  status: "satilik" | "kiralik" | "opsiyonda";
  label: string;
  description?: string;
  size: "sm" | "md" | "lg" | "xl";
  animation: "none" | "pulse";
}

export interface TextHotspotMetadata {
  content: string;
  fontSize: "sm" | "md" | "lg" | "xl" | "2xl";
  fontWeight: "normal" | "semibold" | "bold";
  color: string;
  bgColor: string;
  bgOpacity: number;
  borderRadius: "none" | "sm" | "md" | "lg";
  animation: "none" | "fade" | "glow" | "float";
}
