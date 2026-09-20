import type { NextConfig } from "next";

/**
 * Two build modes:
 *  - default: normal `next dev` / `next build` (Vercel-style hosting).
 *  - STATIC_EXPORT=1: fully static `out/` for GitHub Pages. The app has no
 *    server routes (all state is local), so nothing is lost. Set
 *    NEXT_PUBLIC_BASE_PATH to the Pages sub-path (e.g. /dailyskin15-demo);
 *    lib/assets `withBase` prefixes public asset URLs to match.
 */
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(isStatic
    ? {
        output: "export",
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
