import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_EXPORT === "1" ? "export" : undefined,
  async rewrites() {
    if (process.env.NEXT_EXPORT === "1") return [];
    return [
      { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
    ];
  },
};

export default nextConfig;
