"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Link2,
  Copy,
  Check,
  Code2,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Clock,
} from "lucide-react";
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

interface Share {
  id: string;
  token: string;
  isActive: boolean;
  expiresAt: string | null;
  hasPassword: boolean;
  viewCount: number;
  createdAt: string;
}

interface SharePanelProps {
  projectId: string;
}

export function SharePanel({ projectId }: SharePanelProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/share?projectId=${projectId}`);
      if (res.ok) setShares(await res.json());
      setLoading(false);
    }
    load();
  }, [projectId, refreshKey]);

  async function handleCreate() {
    setCreating(true);
    const body: Record<string, unknown> = { projectId };
    if (password) body.password = password;
    if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();

    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setCreating(false);
    if (res.ok) {
      toast.success("Paylaşım linki oluşturuldu.");
      setModalOpen(false);
      setPassword("");
      setExpiresAt("");
      setRefreshKey((k) => k + 1);
      startTransition(() => router.refresh());
    } else {
      const data = await res.json();
      toast.error(data?.error?.message ?? "Oluşturulamadı.");
    }
  }

  async function handleToggle(share: Share) {
    const res = await fetch(`/api/share/${share.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !share.isActive }),
    });
    if (res.ok) {
      setShares((prev) =>
        prev.map((s) => (s.id === share.id ? { ...s, isActive: !s.isActive } : s))
      );
      toast.success(share.isActive ? "Link devre dışı bırakıldı." : "Link etkinleştirildi.");
    } else {
      toast.error("Güncellenemedi.");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/share/${id}`, { method: "DELETE" });
    if (res.ok) {
      setShares((prev) => prev.filter((s) => s.id !== id));
      toast.success("Paylaşım silindi.");
    } else {
      toast.error("Silinemedi.");
    }
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getPublicUrl(token: string) {
    return `${window.location.origin}/v/${token}`;
  }

  function getEmbedCode(token: string) {
    const url = `${window.location.origin}/embed/${token}`;
    return `<iframe src="${url}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Paylaşım Linkleri</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Her link benzersiz bir token ile korunur.
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="size-3.5" />
          Yeni Link
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : shares.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center rounded-xl border border-dashed border-border">
          <Link2 className="size-8 text-subtle mb-2" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            Henüz paylaşım linki yok.
          </p>
          <p className="text-xs text-subtle mt-1">
            Müşterilere özel linkler oluşturabilirsiniz.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {shares.map((share) => {
            const url = typeof window !== "undefined" ? getPublicUrl(share.token) : "";
            const embed = typeof window !== "undefined" ? getEmbedCode(share.token) : "";
            const expired =
              share.expiresAt ? new Date(share.expiresAt) < new Date() : false;

            return (
              <li
                key={share.id}
                className={`rounded-xl border border-border bg-surface p-3 space-y-2 transition-opacity ${
                  !share.isActive || expired ? "opacity-60" : ""
                }`}
              >
                {/* Top row */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {share.hasPassword ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-400/10 rounded px-1.5 py-0.5">
                          <Lock className="size-2.5" /> Şifreli
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 rounded px-1.5 py-0.5">
                          <Globe className="size-2.5" /> Açık
                        </span>
                      )}
                      {expired && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive bg-destructive/10 rounded px-1.5 py-0.5">
                          <Clock className="size-2.5" /> Süresi Doldu
                        </span>
                      )}
                      {!share.isActive && !expired && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                          Devre Dışı
                        </span>
                      )}
                      <span className="text-[10px] text-subtle ml-auto">
                        {share.viewCount} görüntülenme
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                      /v/{share.token}
                    </p>
                    {share.expiresAt && (
                      <p className="text-[10px] text-subtle mt-0.5">
                        Son: {format(new Date(share.expiresAt), "d MMM yyyy", { locale: tr })}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(share)}
                      className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
                      title={share.isActive ? "Devre dışı bırak" : "Etkinleştir"}
                    >
                      {share.isActive ? (
                        <Eye className="size-3.5" />
                      ) : (
                        <EyeOff className="size-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(share.id)}
                      className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-destructive"
                      title="Sil"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Copy buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(url, `link-${share.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs rounded-lg border border-border bg-surface-elevated hover:bg-surface-elevated/80 py-1.5 transition-colors"
                  >
                    {copiedId === `link-${share.id}` ? (
                      <Check className="size-3 text-success" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    Link Kopyala
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(embed, `embed-${share.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs rounded-lg border border-border bg-surface-elevated hover:bg-surface-elevated/80 py-1.5 transition-colors"
                  >
                    {copiedId === `embed-${share.id}` ? (
                      <Check className="size-3 text-success" />
                    ) : (
                      <Code2 className="size-3" />
                    )}
                    Embed Kodu
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Create modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Yeni Paylaşım Linki</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="share-password">Parola (opsiyonel)</Label>
              <Input
                id="share-password"
                type="password"
                placeholder="Parola girilmezse herkese açık olur"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="share-expires">Son Kullanma Tarihi (opsiyonel)</Label>
              <Input
                id="share-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setModalOpen(false)}
                disabled={creating}
              >
                İptal
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Oluşturuluyor…" : "Oluştur"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
