"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles: { email: string; full_name: string | null } | null;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface ProjectMembersManagerProps {
  projectId: string;
  allUsers: User[];
}

export function ProjectMembersManager({ projectId, allUsers }: ProjectMembersManagerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("editor");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []))
      .finally(() => setLoading(false));
  }, [projectId]);

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));

  async function handleAdd() {
    if (!selectedUserId) return;
    setAdding(true);
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
    });
    setAdding(false);
    if (res.ok) {
      toast.success("Kullanıcı projeye eklendi.");
      setSelectedUserId("");
      // Refetch members
      const data = await fetch(`/api/projects/${projectId}/members`).then((r) => r.json());
      setMembers(data.members ?? []);
      startTransition(() => router.refresh());
    } else {
      const json = await res.json();
      toast.error(json.error?.message ?? "Eklenemedi.");
    }
  }

  async function handleRemove(userId: string) {
    const res = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Kullanıcı projeden çıkarıldı.");
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      startTransition(() => router.refresh());
    } else {
      toast.error("Çıkarılamadı.");
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Yükleniyor…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current members */}
      <div>
        <h3 className="text-sm font-medium mb-3">Mevcut Üyeler</h3>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz bu projeye atanmış kullanıcı yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {m.profiles?.full_name ?? m.profiles?.email ?? "—"}
                  </p>
                  {m.profiles?.full_name && (
                    <p className="text-xs text-muted-foreground truncate">{m.profiles.email}</p>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {m.role === "editor" ? "Editör" : "Görüntüleyici"}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleRemove(m.user_id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add member */}
      {availableUsers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Kullanıcı Ekle</h3>
          <div className="flex gap-2 flex-wrap">
            <Select
              items={availableUsers.map((u) => ({
                value: u.id,
                label: u.full_name ? `${u.full_name} — ${u.email}` : u.email,
              }))}
              value={selectedUserId}
              onValueChange={(v) => v && setSelectedUserId(v)}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Kullanıcı seçin" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name ? `${u.full_name} — ${u.email}` : u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              items={[
                { value: "editor", label: "Editör" },
                { value: "viewer", label: "Görüntüleyici" },
              ]}
              value={selectedRole}
              onValueChange={(v) => v && setSelectedRole(v as "editor" | "viewer")}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editör</SelectItem>
                <SelectItem value="viewer">Görüntüleyici</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleAdd}
              disabled={!selectedUserId || adding}
              size="sm"
            >
              {adding ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserPlus className="size-3.5" />
              )}
              Ekle
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
