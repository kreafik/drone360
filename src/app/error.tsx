"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="tr" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
          <p className="font-display text-[160px] leading-none text-foreground/[0.06] select-none">
            !
          </p>
          <h1 className="font-display text-3xl -mt-4">Beklenmedik hata</h1>
          <p className="text-muted-foreground text-sm mt-3 max-w-xs">
            Bir şeyler ters gitti. Sayfayı yenilemek veya tekrar denemek işe yarayabilir.
          </p>
          {error.digest && (
            <p className="text-xs text-subtle mt-2 font-mono">{error.digest}</p>
          )}
          <Button onClick={reset} variant="outline" className="mt-8">
            Tekrar dene
          </Button>
        </div>
      </body>
    </html>
  );
}
