"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsFormProps {
  profile: {
    id: string;
    fullName: string | null;
    companyName: string | null;
    email: string;
  };
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [companyName, setCompanyName] = useState(profile.companyName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleProfileSave() {
    setSavingProfile(true);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, companyName: companyName || null }),
    });
    setSavingProfile(false);
    if (res.ok) {
      toast.success("Profil güncellendi.");
    } else {
      const data = await res.json();
      toast.error(data?.error?.message ?? "Kaydedilemedi.");
    }
  }

  async function handlePasswordChange() {
    if (newPassword.length < 8) {
      toast.error("Yeni şifre en az 8 karakter olmalı.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }

    setSavingPassword(true);
    const supabase = createClient();

    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      setSavingPassword(false);
      toast.error("Mevcut şifre hatalı.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Şifre güncellendi.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <div className="space-y-8 max-w-lg">
      {/* Profil */}
      <section className="rounded-xl border border-border bg-surface p-6 space-y-5">
        <div>
          <h2 className="font-medium">Profil Bilgileri</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dashboard ve paylaşımlarda görünen bilgiler.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-email">E-posta</Label>
          <Input id="s-email" value={profile.email} disabled className="opacity-60" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-name">Ad Soyad</Label>
          <Input
            id="s-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ali Yılmaz"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-company">Şirket Adı</Label>
          <Input
            id="s-company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Gayrimenkul"
          />
        </div>

        <Button onClick={handleProfileSave} disabled={savingProfile}>
          {savingProfile ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </section>

      {/* Şifre */}
      <section className="rounded-xl border border-border bg-surface p-6 space-y-5">
        <div>
          <h2 className="font-medium">Şifre Değiştir</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            En az 8 karakter olmalı.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-current">Mevcut Şifre</Label>
          <Input
            id="s-current"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-new">Yeni Şifre</Label>
          <Input
            id="s-new"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-confirm">Yeni Şifre (Tekrar)</Label>
          <Input
            id="s-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <Button onClick={handlePasswordChange} disabled={savingPassword}>
          {savingPassword ? "Güncelleniyor…" : "Şifreyi Güncelle"}
        </Button>
      </section>
    </div>
  );
}
