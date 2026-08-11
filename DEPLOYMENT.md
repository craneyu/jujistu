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

**SQLite 特別說明**: 使用 SQLite 讓部署變得更簡單，無需外部資料庫服務！

### 選項 2：Netlify 部署

1. Fork 此 repository
2. 在 [Netlify](https://netlify.com) 註冊帳戶
3. 連接您的 GitHub repository
4. 直接部署即可，建置設定由 repo 內的 `netlify.toml` 提供

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/craneyu/jujistu)

#### Netlify 上的注意事項

`netlify.toml` 會用 `npm run build:netlify` 建置，和本機的 `npm run build` 有幾點差異，
都是為了讓 build 在 Netlify 的環境下不會中斷：

- 不使用 `next build --turbopack`，production 建置走穩定的 webpack 路徑
- 在 build 階段建立並灌入示範資料（`prisma migrate deploy` → `init-db.js` → `prisma db seed`）
- `netlify.toml` 的 `[build.environment]` 只在 build 期間有效，**Functions runtime 讀不到**。
  `src/lib/prisma.ts` 因此內建了與 build 相同的 SQLite 預設路徑

⚠️ **SQLite 在 Netlify 上是唯讀的**

Netlify Functions 的檔案系統唯讀，且每次 cold start 都會還原成 build 當下的狀態。
因此在 Netlify 上：

- ✅ 可以瀏覽頁面、讀取賽事項目與系統設定、瀏覽後台
- ❌ 單位註冊、選手報名、繳費上傳等**寫入操作會失敗**

要讓寫入功能可用，必須改接外部資料庫（見下方）。

#### 升級為可寫入（改接 Postgres）

專案內已有一份 Postgres 版本的 schema（`prisma/schema.azure.prisma`）：

1. 在 Netlify 的 Database 頁面（或任一 Postgres 服務）建立資料庫
2. 用該 schema 取代 `prisma/schema.prisma`，並重新產生 migration
   （既有 migration 是 SQLite 語法，不能直接沿用）
3. 在 Netlify UI 的 **Site configuration → Environment variables** 設定 `DATABASE_URL`
   （UI 設定的變數 build 與 runtime 都讀得到，會覆蓋 `netlify.toml` 的預設值）

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

- `DATABASE_URL`: `file:./prisma/production.db` （SQLite 檔案路徑）
- `NEXTAUTH_SECRET`: NextAuth 密鑰（產生方式：`openssl rand -base64 32`）
- `NEXTAUTH_URL`: 您的網站 URL

### Azure 儲存體（用於檔案上傳，可選）

- `AZURE_STORAGE_ACCOUNT_NAME`: Azure 儲存體帳戶名稱
- `AZURE_STORAGE_CONTAINER_NAME`: 儲存容器名稱

### 郵件設定（選用）

- `EMAIL_HOST`: SMTP 伺服器
- `EMAIL_PORT`: SMTP 連接埠
- `EMAIL_USER`: 郵件帳戶
- `EMAIL_PASSWORD`: 郵件密碼

## 📊 SQLite 的優勢

✅ **簡單部署**: 無需外部資料庫服務  
✅ **零設定**: 檔案型資料庫，即開即用  
✅ **免費**: 不需要付費的資料庫服務  
✅ **高效能**: 適合中小型應用  
✅ **可攜性**: 整個資料庫就是一個檔案

## 🗄️ 預設帳號

初始化腳本會建立兩種不同的登入身分，請勿混用：

| 用途 | 入口 | 帳號 | 密碼 | 驗證來源 |
|---|---|---|---|---|
| 後台管理 | `/admin` | `admin` | `admin123` | `src/app/api/admin/login/route.ts` 內的固定帳密 |
| 報名單位 | 首頁單位登入 | `admin@jujitsu.com` | `admin123` | 資料庫 `RegistrationUnit` 資料表 |

後台登入**不經過資料庫**，`RegistrationUnit` 也沒有 `isAdmin` 欄位。

⚠️ **重要**: 部署後請立即修改這兩組密碼！後台密碼需改 `ADMIN_PASSWORD_HASH` 常數。

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
