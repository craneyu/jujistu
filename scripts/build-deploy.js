#!/usr/bin/env node
/**
 * 部署用的建置流程（Vercel / Netlify 共用）。
 *
 * 用 Node 腳本而不是一長串 shell `&&` 的原因：
 *
 * 1. 保證 DATABASE_URL 一定有值。平台設定（vercel.json 的 build.env、
 *    netlify.toml 的 [build.environment]）不一定會傳進建置指令，
 *    少了它 `prisma migrate deploy` 會直接失敗，整個部署就沒有產出。
 * 2. 資料庫步驟採 best-effort。就算資料初始化失敗，網站本身仍應該建得起來、
 *    看得到畫面，而不是整個部署掛掉、只剩平台的預設 404。
 * 3. 每一步都印出步驟名稱，部署 log 可以直接看出卡在哪裡。
 */
const { execSync } = require('child_process');

const DEFAULT_SQLITE_URL = 'file:./prisma/production.db';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_SQLITE_URL;
  console.log(`ℹ️  DATABASE_URL 未設定，使用預設值 ${DEFAULT_SQLITE_URL}`);
}

function run(label, command) {
  console.log(`\n▶ ${label}\n  $ ${command}`);
  execSync(command, { stdio: 'inherit', env: process.env });
}

/** 資料庫步驟：失敗只警告，不中斷部署（網站仍要能看）。 */
function runOptional(label, command) {
  try {
    run(label, command);
    return true;
  } catch (error) {
    console.warn(`\n⚠️  ${label} 失敗，略過此步驟繼續建置。`);
    console.warn(`   原因: ${error.message}`);
    console.warn('   網站仍會建置完成，但依賴資料庫的 API 可能沒有資料。');
    return false;
  }
}

// Prisma Client 一定要產生，否則 next build 會因為找不到 @prisma/client 而失敗。
run('產生 Prisma Client', 'npx prisma generate');

const migrated = runOptional('套用資料庫 migration', 'npx prisma migrate deploy');

if (migrated) {
  runOptional('建立預設報名單位', 'node scripts/init-db.js');
  runOptional('建立競賽項目種子資料', 'node scripts/seed-events.js');
} else {
  console.warn('\n⚠️  migration 未成功，略過資料初始化。');
}

// 網站本體的建置必須成功，失敗就讓部署失敗。
run('建置 Next.js', 'npx next build');

console.log('\n✅ 建置完成');
