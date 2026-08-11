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
/**
 * serverless 環境下 process.cwd() 未必是 bundle 的根目錄，
 * 所以連同 Lambda 的 task root 以及本檔案往上數層目錄一起當作搜尋起點。
 */
function candidateRoots(): string[] {
  const roots = [process.cwd()];

  if (process.env.LAMBDA_TASK_ROOT) roots.push(process.env.LAMBDA_TASK_ROOT);

  let dir = __dirname;
  for (let i = 0; i < 8; i += 1) {
    roots.push(dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return [...new Set(roots)];
}

function resolveDatasourceUrl(): string | undefined {
  // netlify.toml 的 [build.environment] 只在 build 期間有效，Functions runtime 讀不到，
  // 所以這裡補一個與 build 期間一致的預設值；要接 Postgres 時在 Netlify UI 設 DATABASE_URL 即可覆蓋。
  //
  // 注意：這個 fallback 也代表 DATABASE_URL 若打錯字，會靜默退回找不到的 SQLite 檔，
  // 而不是直接以連線錯誤中斷。接 Postgres 後如果讀不到資料，先確認變數名稱拼寫。
  const url = process.env.DATABASE_URL ?? 'file:./prisma/production.db';
  if (!url.startsWith('file:')) return url;

  const raw = url.slice('file:'.length);
  if (path.isAbsolute(raw)) return url;

  const candidates = candidateRoots().flatMap((root) => [
    // DATABASE_URL 寫成 "./prisma/x.db" 時，Prisma 的實際落點是 prisma/prisma/x.db
    path.join(root, 'prisma', raw),
    path.join(root, raw),
  ]);

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (found) return `file:${found}`;

  // 找不到就把搜尋過的路徑印出來，Netlify 的 function log 會直接告訴我們真正的 runtime 路徑。
  console.error(
    '[prisma] 找不到 SQLite 資料庫檔案，已嘗試以下路徑：\n' + candidates.join('\n')
  );
  return url;
}

function createPrismaClient(): PrismaClient {
  const datasourceUrl = resolveDatasourceUrl();
  return datasourceUrl ? new PrismaClient({ datasourceUrl }) : new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
