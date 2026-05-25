"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserDeleteButtonProps {
  userId: string;
  userName: string;
}

export function UserDeleteButton({ userId, userName }: UserDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      toast.success("Kullanıcı silindi.");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data?.error?.message ?? "Silinemedi.");
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className="p-1.5 rounded-md hover:bg-surface-elevated text-muted-foreground hover:text-destructive transition-colors"
        title="Sil"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kullanıcıyı sil</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{userName}</span> adlı kullanıcı
            kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
