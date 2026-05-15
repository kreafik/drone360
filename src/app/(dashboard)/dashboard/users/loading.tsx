import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-border">
          {["Ad Soyad", "E-posta", "Rol", "Kayıt"].map((h) => (
            <Skeleton key={h} className="h-3 w-16" />
          ))}
        </div>
        {/* Rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid grid-cols-4 gap-4 px-4 py-4 border-b border-border last:border-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
