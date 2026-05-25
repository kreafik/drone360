import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUrls } from "@/lib/r2/urls";
import { PanoramaViewerClient } from "@/components/viewer/panorama-viewer-no-ssr";
import type { ViewerPanorama } from "@/components/viewer/panorama-viewer";

export const dynamic = "force-dynamic";

export default async function EmbedPage({
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
  if (share.expires_at && new Date(share.expires_at) < new Date()) notFound();

  // Password protected embeds check cookie
  if (share.password_hash) {
    const cookieStore = await cookies();
    const verified = cookieStore.get(`share_${token}_verified`);
    if (!verified) {
      return (
        <div className="flex h-screen items-center justify-center bg-black">
          <p className="text-white/50 text-sm">Bu içerik parola korumalıdır.</p>
        </div>
      );
    }
  }

  const projectId = share.project_id;

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
  const storageUrls = await resolveUrls(pList.map((p) => p.storage_key));
  const thumbnailUrls = await resolveUrls(pList.map((p) => p.thumbnail_key));

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
    <html lang="tr">
      <body style={{ margin: 0, background: "#000", height: "100vh" }}>
        <PanoramaViewerClient panoramas={panoramas} className="w-full h-screen" showNavbar />
      </body>
    </html>
  );
}
