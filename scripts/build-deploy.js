#!/usr/bin/env node
/**
 * 部署用的建置流程（Vercel / Netlify 共用）。
 *
 * 用 Node 腳本而不是一長串 shell `&&` 的原因：
 *
 * 1. 缺少 DATABASE_URL 時明確中止，而不是讓後續步驟出現難懂的錯誤。
 * 2. 區分「必要」與「可略過」的步驟：schema 沒套用成功就不該產出網站，
 *    但示範資料失敗只是沒有資料，不必讓整個部署失敗。
 * 3. 每一步都印出步驟名稱，部署 log 可以直接看出卡在哪裡。
 */
const { execSync } = require('child_process');

if (!process.env.DATABASE_URL) {
  console.error(
    '\n❌ 缺少 DATABASE_URL 環境變數。\n' +
      '   本專案使用 Postgres，請在部署平台設定連線字串：\n' +
      '   Vercel → Settings → Environment Variables → DATABASE_URL\n' +
      '   serverless 環境請使用 pooled（連線池）字串。\n'
  );
  process.exit(1);
}

// Prisma 要求 schema 內 env("DIRECT_URL") 一定要存在。
// 若服務商只提供一組連線字串，就用 DATABASE_URL 補上。
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.log('ℹ️  DIRECT_URL 未設定，migration 將沿用 DATABASE_URL。');
  console.log('   若 migration 因連線池限制而失敗，請另外設定 unpooled 連線字串。');
}

/** 資料庫步驟的逾時上限。卡住的步驟會被中止，而不是拖到平台 build 逾時。 */
const DB_STEP_TIMEOUT_MS = 5 * 60 * 1000;

function run(label, command, timeout) {
  console.log(`\n▶ ${label}\n  $ ${command}`);
  execSync(command, { stdio: 'inherit', env: process.env, timeout });
}

/** 示範資料：失敗或逾時只警告，不中斷部署。 */
function runOptional(label, command) {
  try {
    run(label, command, DB_STEP_TIMEOUT_MS);
    return true;
  } catch (error) {
    console.warn(`\n⚠️  ${label} 失敗，略過此步驟繼續建置。`);
    console.warn(`   原因: ${error.message}`);
    console.warn('   網站仍會建置完成，但可能缺少預設資料。');
    return false;
  }
}

// Prisma Client 一定要產生，否則 next build 會因為找不到 @prisma/client 而失敗。
run('產生 Prisma Client', 'npx prisma generate');

// migration 是必要步驟。用 Postgres 時失敗代表資料表根本不存在，
// 此時就算網站建置成功，每個 API 都會 500——寧可讓部署失敗，也不要
// 產出一個「部署顯示成功但整站壞掉」的版本。
run('套用資料庫 migration', 'npx prisma migrate deploy', DB_STEP_TIMEOUT_MS);

// 以下為示範資料，兩支腳本都是冪等的，重複部署不會覆蓋既有資料。
runOptional('建立預設報名單位', 'node scripts/init-db.js');
runOptional('建立競賽項目種子資料', 'node scripts/seed-events.js');

// 網站本體的建置必須成功，失敗就讓部署失敗。
run('建置 Next.js', 'npx next build');

console.log('\n✅ 建置完成');
