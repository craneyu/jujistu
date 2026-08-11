import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * 解析 SQLite 的 file: 連線字串。
 *
 * Prisma 解析 `file:` 相對路徑時是以 generated client 的位置為基準
 * （runtime 下就是 node_modules/.prisma/client），不是 process.cwd()。
 * 在 Netlify Functions 這種 serverless bundle 裡基準會跑掉，導致
 * "Unable to open the database file"。所以這裡先自行找到實體檔案，
 * 再把它換成絕對路徑交給 Prisma。
 *
 * 非 SQLite（例如 Postgres）的連線字串原樣回傳。
 */
function resolveDatasourceUrl(): string | undefined {
  // netlify.toml 的 [build.environment] 只在 build 期間有效，Functions runtime 讀不到，
  // 所以這裡補一個與 build 期間一致的預設值；要接 Postgres 時在 Netlify UI 設 DATABASE_URL 即可覆蓋。
  const url = process.env.DATABASE_URL ?? 'file:./prisma/production.db';
  if (!url.startsWith('file:')) return url;

  const raw = url.slice('file:'.length);
  if (path.isAbsolute(raw)) return url;

  const cwd = process.cwd();
  const candidates = [
    // DATABASE_URL 寫成 "./prisma/x.db" 時，Prisma 的實際落點是 prisma/prisma/x.db
    path.join(cwd, 'prisma', raw),
    path.join(cwd, raw),
    path.join(cwd, '.next', 'standalone', 'prisma', raw),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  return found ? `file:${found}` : url;
}

function createPrismaClient(): PrismaClient {
  const datasourceUrl = resolveDatasourceUrl();
  return datasourceUrl ? new PrismaClient({ datasourceUrl }) : new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
