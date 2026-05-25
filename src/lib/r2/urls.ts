import "server-only";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "./client";

export async function resolveUrl(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  // Always use presigned URLs — public R2 URLs are permanent and leak the storage key.
  // 2-hour expiry: long enough for any session (preloading caches images upfront),
  // short enough that a copied URL is useless after the session ends.
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
