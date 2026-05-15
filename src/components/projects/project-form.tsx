"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { projectSchema, type ProjectFormData } from "@/lib/validation/project";

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface ProjectFormProps {
  users: User[];
  defaultValues?: Partial<ProjectFormData>;
  projectId?: string;
  onSuccess?: () => void;
}

const TYPE_ITEMS = [
  { value: "real_estate", label: "Gayrimenkul" },
  { value: "boat", label: "Tekne" },
  { value: "other", label: "Diğer" },
] satisfies { value: string; label: string }[];

export function ProjectForm({
  users,
  defaultValues,
  projectId,
  onSuccess,
}: ProjectFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = !!projectId;

  const ownerItems = users.map((u) => ({
    value: u.id,
    label: u.full_name ? `${u.full_name} — ${u.email}` : u.email,
  }));

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaultValues ?? {},
  });

  async function onSubmit(data: ProjectFormData) {
    setServerError(null);

    const url = isEditing ? `/api/projects/${projectId}` : "/api/projects";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error?.message ?? "Bir hata oluştu.");
      return;
    }

    toast.success(isEditing ? "Proje güncellendi." : "Proje oluşturuldu.");

    if (isEditing) {
      router.refresh();
      onSuccess?.();
    } else {
      router.push(`/dashboard/projects/${json.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {serverError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">
          Başlık <span className="text-danger">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Örn. Beykoz Villa Turu"
          aria-invalid={!!errors.title}
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-danger">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          placeholder="Proje hakkında kısa bir açıklama"
          rows={3}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-danger">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>
          Proje Türü <span className="text-danger">*</span>
        </Label>
        <Select
          items={TYPE_ITEMS}
          defaultValue={defaultValues?.type}
          onValueChange={(v) =>
            v && setValue("type", v as ProjectFormData["type"], { shouldValidate: true })
          }
        >
          <SelectTrigger aria-invalid={!!errors.type} className="w-full">
            <SelectValue placeholder="Tür seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="real_estate">Gayrimenkul</SelectItem>
            <SelectItem value="boat">Tekne</SelectItem>
            <SelectItem value="other">Diğer</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-danger">{errors.type.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Konum</Label>
        <Input
          id="location"
          placeholder="Örn. Beykoz, İstanbul"
          {...register("location")}
        />
      </div>

      <div className="space-y-1.5">
        <Label>
          Proje Sahibi <span className="text-danger">*</span>
        </Label>
        <Select
          items={ownerItems}
          defaultValue={defaultValues?.ownerId}
          onValueChange={(v) =>
            v && setValue("ownerId", v, { shouldValidate: true })
          }
        >
          <SelectTrigger aria-invalid={!!errors.ownerId} className="w-full">
            <SelectValue placeholder="Müşteri seçin" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.full_name ? `${u.full_name} — ${u.email}` : u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.ownerId && (
          <p className="text-sm text-danger">{errors.ownerId.message}</p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => (isEditing ? onSuccess?.() : router.back())}
        >
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {isEditing ? "Kaydediliyor…" : "Oluşturuluyor…"}
            </>
          ) : isEditing ? (
            "Kaydet"
          ) : (
            "Proje Oluştur"
          )}
        </Button>
      </div>
    </form>
  );
}
