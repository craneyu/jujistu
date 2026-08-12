import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * 資料庫改用 Postgres 後，不再需要先前為了 SQLite 檔案路徑所做的解析。
 *
 * 這裡刻意不提供任何預設值：以前 SQLite 時代的 fallback 會在 DATABASE_URL
 * 沒設定或打錯字時，靜默退回一個不存在的檔案，導致「部署成功但 API 全部壞掉」
 * 這種最難查的狀況。現在寧可在啟動時就明確失敗。
 */
function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      '[prisma] 缺少 DATABASE_URL 環境變數。\n' +
        '請在部署平台設定 Postgres 連線字串（Vercel：Settings → Environment Variables）。\n' +
        'serverless 環境請使用 pooled 連線字串。'
    );
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
