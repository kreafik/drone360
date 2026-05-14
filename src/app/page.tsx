import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-primary">
          <Compass className="size-8" />
          <span className="font-display text-3xl">drone360</span>
        </div>
        <p className="text-muted-foreground text-sm">
          360° Panorama Platform — Phase 0 Setup
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button>Test Butonu</Button>
        <Button variant="secondary">İkincil Aksiyon</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Sil</Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground max-w-sm">
        Kurulum tamamlandı. Koyu zemin, warm amber buton ve font sistemi aktif olmalı.
      </div>
    </main>
  );
}
