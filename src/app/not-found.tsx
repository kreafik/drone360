import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="font-display text-[160px] leading-none text-foreground/[0.06] select-none tabular-nums">
        404
      </p>
      <h1 className="font-display text-3xl -mt-4">Sayfa bulunamadı</h1>
      <p className="text-muted-foreground text-sm mt-3 max-w-xs">
        Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
      </p>
      <Link
        href="/dashboard"
        className={buttonVariants({ variant: "outline", className: "mt-8" })}
      >
        Dashboard&apos;a dön
      </Link>
    </div>
  );
}
