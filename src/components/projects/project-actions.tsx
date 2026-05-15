"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Globe, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProjectForm } from "./project-form";
import { cn } from "@/lib/utils";
import type { ProjectFormData } from "@/lib/validation/project";

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  location: string | null;
  owner_id: string;
}

interface ProjectActionsProps {
  project: Project;
  users: User[];
}

export function ProjectActions({ project, users }: ProjectActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isPublished = project.status === "published";

  async function handleStatusToggle() {
    setStatusLoading(true);
    const newStatus = isPublished ? "draft" : "published";
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatusLoading(false);
    if (!res.ok) {
      toast.error("Durum güncellenemedi.");
      return;
    }
    toast.success(
      newStatus === "published" ? "Proje yayınlandı." : "Proje taslağa alındı."
    );
    router.refresh();
  }

  async function handleDelete() {
    setDeleteLoading(true);
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setDeleteLoading(false);
    if (!res.ok) {
      toast.error("Proje silinemedi.");
      setDeleteOpen(false);
      return;
    }
    toast.success("Proje silindi.");
    router.push("/dashboard/projects");
    router.refresh();
  }

  const editDefaults: Partial<ProjectFormData> = {
    title: project.title,
    description: project.description ?? undefined,
    type: project.type as ProjectFormData["type"],
    location: project.location ?? undefined,
    ownerId: project.owner_id,
  };

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleStatusToggle}
          disabled={statusLoading}
        >
          {statusLoading ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : isPublished ? (
            <FileText className="mr-1.5 size-3.5" />
          ) : (
            <Globe className="mr-1.5 size-3.5" />
          )}
          {isPublished ? "Taslağa Al" : "Yayınla"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "px-2")}
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Daha fazla</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 size-3.5" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 size-3.5" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90dvh]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Projeyi Düzenle
            </DialogTitle>
          </DialogHeader>
          <ProjectForm
            users={users}
            defaultValues={editDefaults}
            projectId={project.id}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Projeyi sil?
            </DialogTitle>
            <DialogDescription>
              <strong className="text-foreground">{project.title}</strong>{" "}
              projesi ve tüm panoramaları silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteLoading}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Siliniyor…
                </>
              ) : (
                "Evet, Sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
