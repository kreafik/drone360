import "server-only";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "./client";

// Returns a proxy URL that streams through /api/media with auth validation.
// The storage key is never exposed to the client; auth is enforced on every request.
// shareToken is required for public share/embed viewers; omit for dashboard (session cookie).
export async function resolveProxyUrl(
  key: string | null | undefined,
  shareToken?: string
): Promise<string | null> {
  if (!key) return null;
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  const url = `/api/media/${encoded}`;
  return shareToken ? `${url}?s=${encodeURIComponent(shareToken)}` : url;
}

export async function resolveProxyUrls(
  keys: (string | null | undefined)[],
  shareToken?: string
): Promise<(string | null)[]> {
  return Promise.all(keys.map((k) => resolveProxyUrl(k, shareToken)));
}

// Presigned URL for cases that need a public absolute URL:
// thumbnails (used by next/image optimizer which fetches server-side without user cookies)
// and cover_url stored in DB (used by OG meta tags for social crawlers).
export async function resolveUrl(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn: 7200 }
  );
}

export async function resolveUrls(
  keys: (string | null | undefined)[]
): Promise<(string | null)[]> {
  return Promise.all(keys.map((k) => resolveUrl(k)));
}
