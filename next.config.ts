import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["latr-packages"],
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return [
      {
        source: "/client-metadata.json",
        destination: "/api/oauth/client-metadata",
      },
    ];
  },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
