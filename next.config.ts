import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co").hostname;

const isDev = process.env.NODE_ENV === "development";

// CSP without nonces (Next "Without Nonces" recipe): nonces would force every page to render
// dynamically and drop the prerendered shell. 'unsafe-inline' is kept for scripts because Next
// streams inline RSC payload scripts; everything else is locked to known origins.
// ponytail: switch to nonce-based CSP if the site ever embeds untrusted HTML.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://images.unsplash.com https://${supabaseHost} https://img.vietqr.io`,
  "font-src 'self'",
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Only on https deployments: on http://localhost it would upgrade redirects to a non-existent https server.
  ...(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-**" },
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/cs-products/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
