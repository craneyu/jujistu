# 柔術報名網站部署指南

## 🚀 在線展示

您可以通過以下方式部署此網站：

### 選項 1：Vercel 部署（推薦）

1. Fork 此 repository 到您的 GitHub 帳戶
2. 在 [Vercel](https://vercel.com) 註冊帳戶
3. 連接您的 GitHub repository
4. 設定環境變數（參考 `.env.example`）
5. 點擊部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/craneyu/jujistu)

### 選項 2：Netlify 部署

1. Fork 此 repository
2. 在 [Netlify](https://netlify.com) 註冊帳戶
3. 連接您的 GitHub repository
4. 設定環境變數
5. 部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/craneyu/jujistu)

### 選項 3：Azure 部署

此專案已配置 Azure Container Apps 部署：

```bash
# 安裝 Azure Developer CLI
curl -fsSL https://aka.ms/install-azd.sh | bash

# 登入 Azure
azd auth login

# 初始化專案
azd init

# 部署到 Azure
azd up
```

## 🔧 環境變數設定

部署前需要設定以下環境變數：

### 必要變數
- `DATABASE_URL`: PostgreSQL 資料庫連接字串
- `NEXTAUTH_SECRET`: NextAuth 密鑰
- `NEXTAUTH_URL`: 您的網站 URL

### Azure 儲存體（用於檔案上傳）
- `AZURE_STORAGE_ACCOUNT_NAME`: Azure 儲存體帳戶名稱
- `AZURE_STORAGE_CONTAINER_NAME`: 儲存容器名稱

### 郵件設定（選用）
- `EMAIL_HOST`: SMTP 伺服器
- `EMAIL_PORT`: SMTP 連接埠
- `EMAIL_USER`: 郵件帳戶
- `EMAIL_PASSWORD`: 郵件密碼

## 📋 功能特色

- ✅ 運動員註冊系統
- ✅ 教練認證管理
- ✅ 賽事管理
- ✅ 付款證明上傳
- ✅ 管理員後台
- ✅ 響應式設計
- ✅ 多檔案上傳支援

## 🛠 本地開發

```bash
# 安裝相依套件
npm install

# 設定環境變數
cp .env.example .env.local

# 初始化資料庫
npm run prisma:migrate

# 啟動開發伺服器
npm run dev
```

## 📞 支援

如有問題，請在 GitHub Issues 提出。
