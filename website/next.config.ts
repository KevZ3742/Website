// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: false,
  images: {
    // output: "export" has no server to run the optimizer on, so this is
    // required regardless — it also means external hosts (placehold.co, or
    // your own CDN later) work without extra remotePatterns config.
    unoptimized: true,
  },
};

export default nextConfig;