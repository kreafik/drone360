"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <p className="font-display text-[100px] leading-none text-foreground/[0.06] select-none">
        !
      </p>
      <h2 className="font-display text-2xl -mt-2">Bir şeyler ters gitti</h2>
      <p className="text-muted-foreground text-sm mt-2 max-w-xs">
        Bu sayfa yüklenirken hata oluştu.
      </p>
      {error.digest && (
        <p className="text-xs text-subtle mt-1 font-mono">{error.digest}</p>
      )}
      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Dashboard
        </Button>
        <Button onClick={reset}>Tekrar dene</Button>
      </div>
    </div>
  );
}
