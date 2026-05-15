import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUrls } from "@/lib/r2/urls";
import { AnalyticsViewer } from "@/components/viewer/analytics-viewer";
import type { ViewerPanorama } from "@/components/viewer/panorama-viewer";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("shares")
    .select("projects(title, description, cover_url)")
    .eq("token", token)
    .single();
  const project = data?.projects as { title?: string; description?: string; cover_url?: string | null } | null;
  const title = project?.title ? `${project.title} — 360° Tur` : "360° Sanal Tur";
  const description = project?.description ?? "Bu sanal turu 360° olarak keşfedin.";
  const coverUrl = project?.cover_url ?? null;
  const images = coverUrl ? [{ url: coverUrl, width: 1200, height: 630 }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(images.length > 0 && { images }),
    },
    twitter: {
      card: coverUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(coverUrl && { images: [coverUrl] }),
    },
  };
}

export default async function PublicViewerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: share } = await supabase
    .from("shares")
    .select("id, project_id, is_active, expires_at, password_hash")
    .eq("token", token)
    .single();

  if (!share || !share.is_active) notFound();

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    notFound();
  }

  // Check password gate
  if (share.password_hash) {
    const cookieStore = await cookies();
    const verified = cookieStore.get(`share_${token}_verified`);
    if (!verified) {
      redirect(`/v/${token}/password`);
    }
  }

  // Increment view count
  await supabase
    .from("shares")
    .update({ view_count: supabase.rpc("increment_view_count" as never) as never })
    .eq("id", share.id);

  // Fetch project + panoramas + hotspots
  const projectId = share.project_id;

  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .is("deleted_at", null)
    .single();

  if (!project) notFound();

  const { data: rawPanoramas } = await supabase
    .from("panoramas")
    .select("id, title, position, storage_key, thumbnail_key, default_yaw, default_pitch, default_zoom")
    .eq("project_id", projectId)
    .eq("status", "ready")
    .is("deleted_at", null)
    .order("position");

  const pList = rawPanoramas ?? [];

  const { data: rawHotspots } = pList.length
    ? await supabase
        .from("hotspots")
        .select("id, panorama_id, type, yaw, pitch, title, description, target_panorama_id")
        .in("panorama_id", pList.map((p) => p.id))
    : { data: [] };

  const hotspots = rawHotspots ?? [];
  const storageUrls = await resolveUrls(pList.map((p) => p.storage_key));
  const thumbnailUrls = await resolveUrls(pList.map((p) => p.thumbnail_key));

  // Use server-side Supabase client (with RLS) for URL resolution — admin client already resolved above
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
        type: h.type as "link" | "info",
        yaw: h.yaw,
        pitch: h.pitch,
        title: h.title,
        description: h.description,
        targetPanoramaId: h.target_panorama_id,
      })),
  }));

  return (
    <div className="fixed inset-0 bg-black">
      {panoramas.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-white/50 text-sm">Bu turda henüz panorama bulunmuyor.</p>
        </div>
      ) : (
        <AnalyticsViewer
          panoramas={panoramas}
          projectId={projectId}
          shareId={share.id}
          className="w-full h-full"
          showNavbar
        />
      )}
    </div>
  );
}
