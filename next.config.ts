import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.rebrickable.com",
      },
      {
        protocol: "https",
        hostname: "rebrickable.com",
      },
    ],
  },
};

export default nextConfig;
