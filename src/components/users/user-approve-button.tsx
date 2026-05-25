"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function UserApproveButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Kullanıcı onaylandı.");
      router.refresh();
    } else {
      toast.error("Onaylanamadı.");
    }
  }

  return (
    <Button size="sm" onClick={handleApprove} disabled={loading}>
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <CheckCircle className="size-3.5" />
      )}
      Onayla
    </Button>
  );
}
