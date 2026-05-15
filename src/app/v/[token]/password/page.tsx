"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SharePasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { token } = await params;
    const res = await fetch("/api/share/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push(`/v/${token}`);
      router.refresh();
    } else {
      const { error: err } = await res.json();
      setError(err?.message ?? "Yanlış parola.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="size-12 rounded-full bg-surface-elevated flex items-center justify-center">
            <Lock className="size-5 text-subtle" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl">Parola Gerekli</h1>
          <p className="text-sm text-muted-foreground">
            Bu tura erişmek için parola girin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parolanızı girin…"
            autoFocus
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? "Doğrulanıyor…" : "Giriş"}
          </Button>
        </form>
      </div>
    </div>
  );
}
