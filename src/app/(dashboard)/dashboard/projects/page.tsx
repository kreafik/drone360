import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";
import { getProfile } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";

export const metadata = { title: "Projeler — drone360" };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile) return null;

  const isAdmin = profile.role === "admin";

  const query = supabase
    .from("projects")
    .select(`
      id, title, type, status, location, cover_url, updated_at,
      panoramas(count)
    `)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (!isAdmin) query.eq("owner_id", profile.id);

  const { data: projects } = await query;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Projeler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects?.length ?? 0} proje
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/projects/new" className={buttonVariants()}>
            <Plus className="mr-2 size-4" strokeWidth={2} />
            Yeni Proje
          </Link>
        )}
      </div>

      {!projects?.length ? (
        <div className="flex flex-col items-center text-center py-16 rounded-xl border border-dashed border-border">
          <div className="size-14 rounded-full bg-surface-elevated grid place-items-center mb-4">
            <FolderOpen className="size-6 text-subtle" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-xl mb-2">Henüz proje yok</h3>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            İlk 360° projenizi oluşturun ve müşterilerinizle paylaşmaya başlayın.
          </p>
          {isAdmin && (
            <Link href="/dashboard/projects/new" className={buttonVariants()}>
              Yeni Proje Oluştur
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              id={p.id}
              title={p.title}
              type={p.type}
              status={p.status}
              location={p.location}
              coverUrl={p.cover_url}
              updatedAt={p.updated_at}
              panoramaCount={(p.panoramas as unknown as { count: number }[])?.[0]?.count ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
