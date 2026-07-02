import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Bake the server-only SerpApi key in at build time. Amplify exposes console
  // env vars to the build (but not reliably to the SSR runtime), so inlining here
  // guarantees the Lead Finder route handler can read it. It's referenced only in
  // server code, so it stays in the server bundle — never shipped to the browser.
  env: {
    SERPAPI_KEY: process.env.SERPAPI_KEY ?? "",
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  eslint: {
    dirs: ["app", "components", "lib"],
  },
  headers: async () => {
    return [
      // API routes must never be cached (the CDN was caching stale 503s).
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      // Cache everything else (excludes /api via negative lookahead).
      {
        source: "/((?!api/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
