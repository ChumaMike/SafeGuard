import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql", "sharp"],
  images: { unoptimized: true },
};

export default nextConfig;
