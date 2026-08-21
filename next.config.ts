import type { NextConfig } from "next";

const allowedOrigins = [
  "localhost:3000",
  "127.0.0.1:3000",
  "stitchhappens.turniertool.eu",
  "*.turniertool.eu",
  ...(process.env.ALLOWED_ORIGINS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: [...new Set(allowedOrigins)],
    },
    // Hostinger reverse proxy may not preserve RSC cache headers correctly.
    validateRSCRequestHeaders: false,
  },
};

export default nextConfig;
