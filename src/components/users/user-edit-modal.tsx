"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserEditModalProps {
  user: {
    id: string;
    fullName: string | null;
    companyName: string | null;
    brandName: string | null;
    brandLogoUrl: string | null;
    brandPrimaryColor: string | null;
  };
}

export function UserEditModal({ user }: UserEditModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [companyName, setCompanyName] = useState(user.companyName ?? "");
  const [brandName, setBrandName] = useState(user.brandName ?? "");
  const [brandLogoUrl, setBrandLogoUrl] = useState(user.brandLogoUrl ?? "");
  const [brandPrimaryColor, setBrandPrimaryColor] = useState(
    user.brandPrimaryColor ?? "#f59e0b"
  );

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName || undefined,
        companyName: companyName || null,
        brandName: brandName || null,
        brandLogoUrl: brandLogoUrl || null,
        brandPrimaryColor: brandPrimaryColor || null,
      }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Profil güncellendi.");
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data?.error?.message ?? "Kaydedilemedi.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-md hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
        title="Düzenle"
      >
        <Pencil className="size-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcı Düzenle</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {/* Temel bilgiler */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-subtle uppercase tracking-wider">
                Profil
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="ue-name">Ad Soyad</Label>
                <Input
                  id="ue-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ali Yılmaz"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ue-company">Şirket Adı</Label>
                <Input
                  id="ue-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Gayrimenkul"
                />
              </div>
            </div>

            {/* White-label */}
            <div className="space-y-3 pt-1 border-t border-border">
              <div>
                <p className="text-xs font-medium text-subtle uppercase tracking-wider">
                  White-label
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Public viewer&apos;da müşteriye ait marka gösterilir.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ue-brandname">Marka Adı</Label>
                <Input
                  id="ue-brandname"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Boş bırakılırsa şirket adı kullanılır"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ue-logo">Logo URL</Label>
                <Input
                  id="ue-logo"
                  value={brandLogoUrl}
                  onChange={(e) => setBrandLogoUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
                {brandLogoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brandLogoUrl}
                    alt="Logo önizleme"
                    className="h-8 w-auto object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ue-color">Ana Renk</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="ue-color"
                    type="color"
                    value={brandPrimaryColor}
                    onChange={(e) => setBrandPrimaryColor(e.target.value)}
                    className="h-9 w-14 rounded-md border border-border bg-transparent cursor-pointer p-0.5"
                  />
                  <Input
                    value={brandPrimaryColor}
                    onChange={(e) => setBrandPrimaryColor(e.target.value)}
                    placeholder="#f59e0b"
                    className="font-mono w-28"
                    maxLength={7}
                  />
                  <span className="text-xs text-muted-foreground">
                    Logo yoksa marka adı bu renkle gösterilir.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                İptal
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
