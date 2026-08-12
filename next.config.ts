import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone 是給 Docker 自架與 Netlify 用的。Vercel 有自己的建置產物格式，
  // build 期間會設 VERCEL=1，這裡讓它走平台預設，避免兩套產物格式互相干擾。
  output: process.env.VERCEL ? undefined : "standalone",
  // Next.js 會往上層找 lockfile 來推斷 tracing root，猜錯時 standalone 內會多出
  // 一層層目錄前綴，導致 runtime 找不到 prisma 檔案。固定在專案根目錄。
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    // Prisma 的 query engine 只有 Netlify 需要顯式帶進 bundle；Vercel 本身就會
    // 處理 Prisma，重複指定會讓每個 API function 各夾帶一份約 34 MB 的 engine，
    // 徒增體積並可能撞到 function 的體積上限。
    // （改用 Postgres 後不再需要把 SQLite 檔案打包進去。）
    "/api/**/*": process.env.VERCEL ? [] : ["./node_modules/.prisma/client/**/*"],
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
