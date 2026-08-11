import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Next.js 會往上層找 lockfile 來推斷 tracing root，猜錯時 standalone 內會多出
  // 一層層目錄前綴，導致 runtime 找不到 prisma 檔案。固定在專案根目錄。
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    // Prisma 的 query engine 與 SQLite 檔案不會被靜態分析追到，
    // 必須顯式帶進 serverless bundle，否則 Netlify Functions 會找不到 engine。
    "/api/**/*": ["./prisma/**/*", "./node_modules/.prisma/client/**/*"],
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
