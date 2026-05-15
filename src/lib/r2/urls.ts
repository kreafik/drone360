import "server-only";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "./client";

export async function resolveUrl(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  if (R2_PUBLIC_URL) return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn: 43200 } // 12 hours
  );
}

export async function resolveUrls(
  keys: (string | null | undefined)[]
): Promise<(string | null)[]> {
  return Promise.all(keys.map((k) => resolveUrl(k)));
}
