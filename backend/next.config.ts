import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@commentary-coach/shared"],
  experimental: {
    proxyClientMaxBodySize: '500mb',
  },
};

export default nextConfig;
