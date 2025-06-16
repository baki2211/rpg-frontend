/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig; 