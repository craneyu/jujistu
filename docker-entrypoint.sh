#!/bin/sh
# 容器啟動流程：先讓資料庫結構就緒，再啟動應用程式。
#
# migration 放在這裡而不是 image build 階段，是因為 build 時連不到任何資料庫；
# 也不放在 azd 的 postdeploy hook，因為那在本機執行，而 PostgreSQL 的防火牆
# 只允許 Azure 服務連入。
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "❌ 缺少 DATABASE_URL，無法啟動。" >&2
  exit 1
fi

# Prisma 要求 schema 內宣告的 DIRECT_URL 必須存在。
if [ -z "$DIRECT_URL" ]; then
  export DIRECT_URL="$DATABASE_URL"
fi

echo "▶ 套用資料庫 migration"
node /opt/prisma/node_modules/prisma/build/index.js migrate deploy --schema=/app/prisma/schema.prisma

# 示範資料：兩支腳本都是冪等的，失敗不阻擋應用程式啟動。
echo "▶ 建立預設報名單位"
node scripts/init-db.js || echo "⚠️  預設報名單位建立失敗，略過"

echo "▶ 建立競賽項目種子資料"
node scripts/seed-events.js || echo "⚠️  種子資料建立失敗，略過"

echo "✅ 資料庫就緒，啟動應用程式"
exec node server.js
