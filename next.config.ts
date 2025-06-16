import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rpg-be.onrender.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;
