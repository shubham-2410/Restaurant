import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@restaurant/shared"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
