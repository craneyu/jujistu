# 柔術報名網站部署指南

## 🚀 在線展示

您可以通過以下方式部署此網站：

### 選項 1：Vercel 部署（本專案實際使用）

1. 在 [Vercel](https://vercel.com) 登入後選 **Add New → Project**
2. 匯入這個 GitHub repository
3. 建置設定不用改，`vercel.json` 已經指定好 framework 與 `npm run build:deploy`
4. 點擊 Deploy

之後只要 push 到 `main`，Vercel 的 GitHub 整合就會自動部署 production。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/craneyu/jujitsu)

> **不需要設定任何 GitHub Actions secrets。** 專案早期曾用
> `amondnet/vercel-action` 搭配 `VERCEL_TOKEN` / `ORG_ID` / `PROJECT_ID` 部署，
> 但那些 secrets 從未設定，導致 workflow 每次都失敗。改用原生整合後已移除該 job，
> `.github/workflows/deploy.yml` 現在只負責建置驗證。

#### 部署成功了，網址卻打不開？

部署狀態顯示 **Ready / success**，但打開網址被導向 Vercel 登入頁（HTTP 302 到
`vercel.com/sso-api`），代表專案開啟了 **Deployment Protection**。
這會擋掉所有未登入的訪客，不分手機或桌面，展示用的網站必須關閉它：

**Vercel → 專案 → Settings → Deployment Protection → Vercel Authentication → Disabled → Save**

判斷方式：

| 回應 | 意義 |
|---|---|
| `302` → `vercel.com/sso-api` | Deployment Protection 開啟，依上述步驟關閉 |
| `404` + `DEPLOYMENT_NOT_FOUND` | 該網址沒有對應的部署（網址打錯，或部署失敗） |
| `200` | 正常 |

這個設定只能在 Vercel dashboard 修改（或透過帶 token 的 API），
repo 內的 `vercel.json` 無法控制。dashboard 需要桌面版介面，
手機瀏覽器可切換「桌面版網站」模式進入。

#### Vercel 會封鎖有已知漏洞的 Next.js 版本

若 build log 最後出現 `Vulnerable version of Next.js detected`，
那不是警告而是**封鎖原因**——build 會成功，但部署不會完成，網址回
`DEPLOYMENT_NOT_FOUND`。CVE-2025-66478 影響 Next.js 15.0.0 ～ 16.0.6，
各 release line 的修補版本：15.4.x → 15.4.8、15.5.x → 15.5.7、16.0.x → 16.0.10。
本專案已升級至 15.5.7。詳見 <https://vercel.com/kb/bulletin/react2shell>。

### 選項 2：Netlify 部署

1. Fork 此 repository
2. 在 [Netlify](https://netlify.com) 註冊帳戶
3. 連接您的 GitHub repository
4. 直接部署即可，建置設定由 repo 內的 `netlify.toml` 提供

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/craneyu/jujitsu)

`netlify.toml` 與 Vercel 共用 `npm run build:deploy`。Netlify 的注意事項是
`[build.environment]` 只在 build 期間有效、Functions runtime 讀不到，
`src/lib/prisma.ts` 因此內建了相同的 SQLite 預設路徑。

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

## 📊 關於 SQLite

✅ **簡單部署**: 無需外部資料庫服務，檔案型資料庫即開即用、免費、可攜

### ⚠️ 但在 serverless 平台上是唯讀的

Vercel 與 Netlify 的 Functions 檔案系統都是**唯讀**的，而且每次 cold start
都會還原成 build 當下的狀態。資料庫檔案是在 build 階段由
`prisma migrate deploy` → `init-db.js` → `prisma db seed` 建立後打包進去的。

因此線上站台的行為是：

- ✅ 瀏覽頁面、讀取賽事項目與系統設定、瀏覽後台
- ❌ 單位註冊、選手報名、繳費上傳等**寫入操作會失敗**

換句話說，目前的線上版本適合當**展示用的範例網站**，不能當正式報名系統使用。

### 升級為可寫入（改接 Postgres）

專案內已有一份 Postgres 版本的 schema（`prisma/schema.azure.prisma`）：

1. 建立一個 Postgres 資料庫（Vercel Postgres、Neon、Supabase 皆可）
2. 用該 schema 取代 `prisma/schema.prisma`，並重新產生 migration
   （既有 migration 是 SQLite 語法，不能直接沿用）
3. 在 Vercel 的 **Settings → Environment Variables** 設定 `DATABASE_URL`
   （會覆蓋 `vercel.json` 內的 SQLite 預設值）

`src/lib/prisma.ts` 對非 `file:` 開頭的連線字串會原樣使用，不需要改程式碼。

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
