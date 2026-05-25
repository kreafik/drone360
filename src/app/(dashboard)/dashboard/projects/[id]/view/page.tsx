import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProfile } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { resolveProxyUrls, resolveUrls } from "@/lib/r2/urls";
import { PanoramaViewerClient } from "@/components/viewer/panorama-viewer-no-ssr";
import type { ViewerPanorama } from "@/components/viewer/panorama-viewer";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("title").eq("id", id).single();
  return { title: data ? `${data.title} — Önizleme` : "Tur Önizleme" };
}

export default async function ProjectViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  // Fetch profile + project in parallel
  const [profile, projectRes] = await Promise.all([
    getProfile(),
    supabase
      .from("projects")
      .select("id, title, metadata")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
  ]);

  if (!profile) return null;
  const project = projectRes.data;
  if (!project) notFound();

  const { data: rawPanoramas } = await supabase
    .from("panoramas")
    .select("id, title, position, storage_key, thumbnail_key, default_yaw, default_pitch, default_zoom")
    .eq("project_id", id)
    .eq("status", "ready")
    .is("deleted_at", null)
    .order("position");

  const pList = rawPanoramas ?? [];

  // Fetch hotspots + storage URLs + thumbnail URLs in parallel
  const [hotspotsRes, storageUrls, thumbnailUrls] = await Promise.all([
    pList.length
      ? supabase
          .from("hotspots")
          .select("id, panorama_id, type, yaw, pitch, title, description, target_panorama_id, metadata")
          .in("panorama_id", pList.map((p) => p.id))
      : Promise.resolve({ data: [] }),
    resolveProxyUrls(pList.map((p) => p.storage_key)),
    resolveUrls(pList.map((p) => p.thumbnail_key)),
  ]);

  const hotspots = hotspotsRes.data ?? [];

  const panoramas: ViewerPanorama[] = pList.map((p, i) => ({
    id: p.id,
    title: p.title,
    panoramaUrl: storageUrls[i] ?? "",
    thumbnailUrl: thumbnailUrls[i],
    defaultYaw: p.default_yaw,
    defaultPitch: p.default_pitch,
    defaultZoom: p.default_zoom,
    hotspots: hotspots
      .filter((h) => h.panorama_id === p.id)
      .map((h) => ({
        id: h.id,
        type: h.type as "link" | "info" | "pin" | "text" | "area" | "floor",
        yaw: h.yaw,
        pitch: h.pitch,
        title: h.title,
        description: h.description,
        targetPanoramaId: h.target_panorama_id,
        metadata: (h.metadata as Record<string, unknown> | null) ?? undefined,
      })),
  }));

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <Link
          href={`/dashboard/projects/${id}`}
          className="pointer-events-auto inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          {project.title}
        </Link>
      </div>

      {/* Viewer */}
      {panoramas.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/50 text-sm">Bu projede henüz hazır panorama yok.</p>
        </div>
      ) : (
        <PanoramaViewerClient
          panoramas={panoramas}
          className="absolute inset-0"
          showNavbar
          showThumbnailNav
          overviewPanoramaId={
            ((project.metadata as Record<string, unknown> | null)?.overview_panorama_id as string | null) ?? null
          }
        />
      )}
    </div>
  );
}
