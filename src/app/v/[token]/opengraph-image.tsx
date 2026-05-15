import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

export const alt = "360° Sanal Tur";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("shares")
    .select("projects(title, description, cover_url)")
    .eq("token", token)
    .eq("is_active", true)
    .single();

  const project = data?.projects as {
    title?: string;
    description?: string;
    cover_url?: string | null;
  } | null;

  const title = project?.title ?? "360° Sanal Tur";
  const description = project?.description ?? "Bu sanal turu 360° olarak keşfedin.";
  const coverUrl = project?.cover_url ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#0a0a0a",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Cover image as background */}
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.35,
            }}
          />
        )}

        {/* Bottom gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.98) 65%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "0 64px 60px",
          }}
        >
          {/* Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#f59e0b",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#f59e0b",
              }}
            />
            360° SANAL TUR
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 45 ? "44px" : "58px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>

          {/* Description */}
          {description && (
            <div
              style={{
                fontSize: "22px",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.4,
                maxWidth: "800px",
                marginTop: "2px",
              }}
            >
              {description.length > 90
                ? description.slice(0, 90) + "…"
                : description}
            </div>
          )}

          {/* Branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "20px",
              color: "rgba(255,255,255,0.25)",
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            drone360
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
