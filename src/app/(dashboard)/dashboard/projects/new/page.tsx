import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata = { title: "Yeni Proje — drone360" };

export default async function NewProjectPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .order("full_name");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Projelere dön
        </Link>
        <h1 className="font-display text-3xl">Yeni Proje</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          360° sanal tur projesi oluşturun.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <ProjectForm users={users ?? []} />
      </div>
    </div>
  );
}
