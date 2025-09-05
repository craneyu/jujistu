#!/bin/bash

echo "🚀 正在啟動柔術報名系統..."

# 檢查是否有 .env.local 檔案
if [ ! -f .env.local ]; then
  echo "📝 建立 .env.local 檔案..."
  cp .env.example .env.local
  echo "✅ 請編輯 .env.local 檔案設定您的環境變數"
fi

# 安裝相依套件
echo "📦 安裝相依套件..."
npm install

# 產生 Prisma client
echo "🔧 產生 Prisma client..."
npm run prisma:generate

# 執行資料庫遷移
echo "🗄️ 執行資料庫遷移..."
npm run prisma:migrate

# 初始化資料庫
echo "🌱 初始化資料庫..."
npm run prisma:seed

echo "✅ 設定完成！"
echo ""
echo "🔑 預設管理員帳戶："
echo "   帳號: admin@jujitsu.com"
echo "   密碼: admin123"
echo ""
echo "🌐 啟動開發伺服器："
echo "   npm run dev"
echo ""
echo "📖 訪問網站："
echo "   http://localhost:3000"
