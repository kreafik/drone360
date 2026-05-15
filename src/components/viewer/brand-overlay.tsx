interface BrandOverlayProps {
  brandName?: string | null;
  brandLogoUrl?: string | null;
  brandPrimaryColor?: string | null;
}

export function BrandOverlay({
  brandName,
  brandLogoUrl,
  brandPrimaryColor,
}: BrandOverlayProps) {
  if (!brandLogoUrl && !brandName) return null;

  const color = brandPrimaryColor ?? "#ffffff";

  return (
    <div className="absolute top-4 left-4 z-20 pointer-events-none select-none">
      {brandLogoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brandLogoUrl}
          alt={brandName ?? ""}
          className="h-8 max-w-[140px] w-auto object-contain drop-shadow-md"
        />
      ) : (
        <span
          className="text-sm font-semibold drop-shadow-md tracking-tight"
          style={{ color }}
        >
          {brandName}
        </span>
      )}
    </div>
  );
}
