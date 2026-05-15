import type { NextConfig } from "next";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const r2Hostname = (() => {
  try {
    return R2_PUBLIC_URL ? new URL(R2_PUBLIC_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // R2 custom CDN domain (from env)
      ...(r2Hostname ? [{ protocol: "https" as const, hostname: r2Hostname }] : []),
      // R2 public dev subdomain
      { protocol: "https" as const, hostname: "*.r2.dev" },
      // R2 private storage (signed URLs)
      { protocol: "https" as const, hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/((?!embed).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/embed/:token*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
