import { NextRequest } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/permissions";

// Node.js runtime required for AWS SDK streaming
export const runtime = "nodejs";
// Allow up to 60s for large panorama transfers on slow connections
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const key = path.join("/");
  const shareToken = req.nextUrl.searchParams.get("s");

  // Validate auth: logged-in session (dashboard) OR valid share token (public viewer/embed)
  let authorized = false;

  if (shareToken) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("shares")
      .select("is_active, expires_at")
      .eq("token", shareToken)
      .single();
    authorized = !!(
      data?.is_active &&
      (!data.expires_at || new Date(data.expires_at) > new Date())
    );
  } else {
    try {
      await requireAuth();
      authorized = true;
    } catch {
      authorized = false;
    }
  }

  if (!authorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  let obj;
  try {
    obj = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch {
    return new Response("Not Found", { status: 404 });
  }

  if (!obj.Body) {
    return new Response("Not Found", { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": obj.ContentType ?? "application/octet-stream",
    // Private browser cache — prevents CDN from storing but lets browser reuse for the session.
    // Preloading fetches all panoramas up front so subsequent PSV navigation hits cache.
    "Cache-Control": "private, max-age=3600",
    "Content-Disposition": "inline",
  });
  if (obj.ContentLength) {
    headers.set("Content-Length", String(obj.ContentLength));
  }

  return new Response(obj.Body as unknown as ReadableStream, { headers });
}
