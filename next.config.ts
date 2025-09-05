import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    outputFileTracingIncludes: {
      "/api/**/*": ["./prisma/**/*"],
    },
  },
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
