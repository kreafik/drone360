import { notFound } from "next/navigation";
import Link from "next/link";
import { ImageIcon, Network, BarChart2, Share2, Eye } from "lucide-react";
import { getProfile } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { resolveUrls } from "@/lib/r2/urls";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProjectActions } from "@/components/projects/project-actions";
import type { PanoramaItem } from "@/components/panoramas/panorama-list";
import { PanoramaListClient } from "@/components/panoramas/panorama-list-client";
import { HotspotEditorClient } from "@/components/viewer/hotspot-editor-client";
import type { ViewerPanorama } from "@/components/viewer/panorama-viewer";
import { SharePanel } from "@/components/projects/share-panel";
import { ProjectAnalytics } from "@/components/analytics/project-analytics";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Taslak", className: "bg-muted text-muted-foreground" },
  published: { label: "Yayında", className: "bg-success/20 text-success" },
  archived: { label: "Arşiv", className: "bg-subtle/20 text-subtle" },
};

const typeLabels: Record<string, string> = {
  real_estate: "Gayrimenkul",
  boat: "Tekne",
  other: "Diğer",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("title")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  return { title: data ? `${data.title} — drone360` : "Proje — drone360" };
}

export default async function ProjectDetailPage({
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
      .select("id, title, description, type, status, location, cover_url, owner_id, created_at, updated_at, metadata")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
  ]);

  if (!profile) return null;
  const project = projectRes.data;
  if (!project) notFound();

  const isAdmin = profile.role === "admin";

  // Fetch users (admin) + panoramas in parallel
  const [usersRes, panoramasRes] = await Promise.all([
    isAdmin
      ? supabase.from("profiles").select("id, email, full_name").order("full_name")
      : Promise.resolve({ data: [] }),
    supabase
      .from("panoramas")
      .select("id, title, position, status, storage_key, thumbnail_key, default_yaw, default_pitch, default_zoom")
      .eq("project_id", id)
      .is("deleted_at", null)
      .order("position"),
  ]);

  const users: { id: string; email: string; full_name: string | null }[] = usersRes.data ?? [];
  const pList = panoramasRes.data ?? [];

  // For hotspot editor — only ready panoramas
  const readyPanoramas = pList.filter((p) => p.status === "ready");

  // Fetch hotspots + all URL batches in parallel
  const [rawHotspotsRes, thumbnailUrls, storageUrls, readyThumbnails] = await Promise.all([
    readyPanoramas.length
      ? supabase
          .from("hotspots")
          .select("id, panorama_id, type, yaw, pitch, title, description, target_panorama_id")
          .in("panorama_id", readyPanoramas.map((p) => p.id))
      : Promise.resolve({ data: [] }),
    resolveUrls(pList.map((p) => p.thumbnail_key)),
    resolveUrls(readyPanoramas.map((p) => p.storage_key)),
    resolveUrls(readyPanoramas.map((p) => p.thumbnail_key)),
  ]);

  const hotspots = rawHotspotsRes.data ?? [];

  // For panorama list tab
  const panoramas: PanoramaItem[] = pList.map((p, i) => ({
    id: p.id,
    title: p.title,
    position: p.position,
    status: p.status,
    thumbnailUrl: thumbnailUrls[i],
  }));

  const editorPanoramas: ViewerPanorama[] = readyPanoramas.map((p, i) => ({
    id: p.id,
    title: p.title,
    panoramaUrl: storageUrls[i] ?? "",
    thumbnailUrl: readyThumbnails[i],
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

  const statusStyle = statusConfig[project.status] ?? statusConfig.draft;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {typeLabels[project.type] ?? project.type}
            </Badge>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusStyle.className
              )}
            >
              {statusStyle.label}
            </span>
          </div>
          <h1 className="font-display text-3xl leading-tight truncate">
            {project.title}
          </h1>
          {project.location && (
            <p className="text-sm text-muted-foreground">{project.location}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {panoramas.some((p) => p.status === "ready") && (
            <Link
              href={`/dashboard/projects/${id}/view`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Eye className="size-3.5" />
              Turu Görüntüle
            </Link>
          )}
          {isAdmin && (
            <ProjectActions
              project={{
                id: project.id,
                title: project.title,
                description: project.description,
                type: project.type,
                status: project.status,
                location: project.location,
                owner_id: project.owner_id,
              }}
              users={users}
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="panoramas">
        <TabsList variant="line" className="w-full justify-start rounded-none border-b border-border pb-0 h-auto gap-0">
          <TabsTrigger value="panoramas" className="rounded-none px-4 pb-3 pt-1">
            <ImageIcon className="size-3.5" />
            Panoramalar
          </TabsTrigger>
          <TabsTrigger value="hotspots" className="rounded-none px-4 pb-3 pt-1">
            <Network className="size-3.5" />
            Hotspot Editörü
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-none px-4 pb-3 pt-1">
            <BarChart2 className="size-3.5" />
            Analitik
          </TabsTrigger>
          <TabsTrigger value="share" className="rounded-none px-4 pb-3 pt-1">
            <Share2 className="size-3.5" />
            Paylaşım
          </TabsTrigger>
        </TabsList>

        <TabsContent value="panoramas" className="mt-6">
          {(() => {
            const meta = (project.metadata as Record<string, unknown> | null) ?? {};
            return (
              <PanoramaListClient
                projectId={id}
                initialPanoramas={panoramas}
                initialCoverPanoramaId={(meta.cover_panorama_id as string | null) ?? null}
                initialOverviewPanoramaId={(meta.overview_panorama_id as string | null) ?? null}
              />
            );
          })()}
        </TabsContent>

        <TabsContent value="hotspots" className="mt-6">
          <HotspotEditorClient panoramas={editorPanoramas} projectId={id} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ProjectAnalytics projectId={id} days={30} />
        </TabsContent>

        <TabsContent value="share" className="mt-6">
          <SharePanel projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

