import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProxyUrls, resolveUrls } from "@/lib/r2/urls";
import { AnalyticsViewer } from "@/components/viewer/analytics-viewer";
import { BrandOverlay } from "@/components/viewer/brand-overlay";
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

  // Increment view count atomically via DB function (UPDATE … SET view_count = view_count + 1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)("increment_share_view_count", { share_id: share.id });

  // Fetch project + panoramas + hotspots
  const projectId = share.project_id;

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, owner_id, metadata")
    .eq("id", projectId)
    .is("deleted_at", null)
    .single();

  if (!project) notFound();

  // Fetch owner branding
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("brand_name, brand_logo_url, brand_primary_color, company_name")
    .eq("id", project.owner_id)
    .single();

  const branding = ownerProfile as {
    brand_name: string | null;
    brand_logo_url: string | null;
    brand_primary_color: string | null;
    company_name: string | null;
  } | null;

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
        .select("id, panorama_id, type, yaw, pitch, title, description, target_panorama_id, metadata")
        .in("panorama_id", pList.map((p) => p.id))
    : { data: [] };

  const hotspots = rawHotspots ?? [];
  // Full panoramas through auth-gated proxy; thumbnails via presigned (needed for next/image)
  const storageUrls = await resolveProxyUrls(pList.map((p) => p.storage_key), token);
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
        type: h.type as "link" | "info" | "pin" | "text" | "area" | "floor" | "direction",
        yaw: h.yaw,
        pitch: h.pitch,
        title: h.title,
        description: h.description,
        targetPanoramaId: h.target_panorama_id,
        metadata: (h.metadata as Record<string, unknown> | null) ?? undefined,
      })),
  }));

  return (
    <div className="fixed inset-0 bg-black">
      {panoramas.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-white/50 text-sm">Bu turda henüz panorama bulunmuyor.</p>
        </div>
      ) : (
        <>
          <AnalyticsViewer
            panoramas={panoramas}
            projectId={projectId}
            shareId={share.id}
            className="w-full h-full"
            showNavbar
            showThumbnailNav
            overviewPanoramaId={
              ((project.metadata as Record<string, unknown> | null)?.overview_panorama_id as string | null) ?? null
            }
          />
          <BrandOverlay
            brandName={branding?.brand_name ?? branding?.company_name}
            brandLogoUrl={branding?.brand_logo_url}
            brandPrimaryColor={branding?.brand_primary_color}
          />
        </>
      )}
    </div>
  );
}
