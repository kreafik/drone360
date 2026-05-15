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
import { inviteUserSchema, type InviteUserFormData } from "@/lib/validation/project";

export function InviteUserForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { sendInvite: true as boolean },
  });

  async function onSubmit(data: InviteUserFormData) {
    setServerError(null);
    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error?.message ?? "Bir hata oluştu.");
      return;
    }

    toast.success("Müşteri davet edildi.");
    router.push("/dashboard/users");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">E-posta <span className="text-danger">*</span></Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder="musteri@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Ad Soyad <span className="text-danger">*</span></Label>
        <Input
          id="fullName"
          type="text"
          autoComplete="off"
          placeholder="Ahmet Yılmaz"
          aria-invalid={!!errors.fullName}
          {...register("fullName")}
        />
        {errors.fullName && <p className="text-sm text-danger">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="companyName">Şirket Adı</Label>
        <Input
          id="companyName"
          type="text"
          autoComplete="off"
          placeholder="Opsiyonel"
          {...register("companyName")}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 size-4 animate-spin" />Davet gönderiliyor…</>
          ) : (
            "Davet Gönder"
          )}
        </Button>
      </div>
    </form>
  );
}
