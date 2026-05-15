import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  real_estate: "Gayrimenkul",
  boat: "Tekne",
  other: "Diğer",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Taslak", className: "bg-muted text-muted-foreground" },
  published: { label: "Yayında", className: "bg-success/20 text-success" },
  archived: { label: "Arşiv", className: "bg-subtle/20 text-subtle" },
};

interface ProjectCardProps {
  id: string;
  title: string;
  type: string;
  status: string;
  location: string | null;
  coverUrl: string | null;
  updatedAt: string;
  panoramaCount?: number;
}

export function ProjectCard({
  id,
  title,
  type,
  status,
  location,
  coverUrl,
  updatedAt,
  panoramaCount = 0,
}: ProjectCardProps) {
  const statusStyle = statusConfig[status] ?? statusConfig.draft;

  return (
    <Link
      href={`/dashboard/projects/${id}`}
      className="group flex flex-col rounded-xl border border-border bg-surface overflow-hidden hover:border-border-strong transition-colors"
    >
      {/* Kapak görseli */}
      <div className="aspect-video bg-surface-elevated relative flex items-center justify-center overflow-hidden">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-subtle">
            <ImageIcon className="size-8" strokeWidth={1} />
            <span className="text-xs">Kapak yok</span>
          </div>
        )}
      </div>

      {/* İçerik */}
      <div className="p-4 space-y-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-tight line-clamp-2">{title}</h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              statusStyle.className
            )}
          >
            {statusStyle.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {typeLabels[type] ?? type}
          </Badge>
          {panoramaCount > 0 && (
            <span>{panoramaCount} panorama</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
          {location ? (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="size-3 shrink-0" />
              {location}
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="size-3" />
            {new Date(updatedAt).toLocaleDateString("tr-TR")}
          </span>
        </div>
      </div>
    </Link>
  );
}
