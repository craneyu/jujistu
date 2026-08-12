# 柔術報名網站部署指南

## 🚀 部署平台

**本專案的正式部署平台是 Azure Container Apps。**

| 平台 | 角色 | 資料庫 |
|---|---|---|
| **Azure Container Apps** | **正式部署** | Azure Database for PostgreSQL Flexible Server |
| Vercel | 早期展示站，保留為備援 | 外部 Postgres（如 Neon） |
| Netlify | 備選，設定保留未使用 | 外部 Postgres |

### 為什麼選 Azure

評估過三大雲的免費方案後的結論：

- **運算**不是分水嶺 — GCP Cloud Run、Azure Container Apps 都有永久免費額度，展示流量用不完
- **資料庫**才是 — GCP Cloud SQL 沒有免費方案；AWS 自 2025-07 改制後新帳號只有 6 個月；Azure 給 12 個月
- **決定性因素是 Visual Studio 訂閱額度** — MSDN credits 為每月重置（Enterprise 150 美元／Professional 50 美元），
  且**消費限制預設為 On**，額度用完只會暫停服務、不會產生帳單。
  其授權條款明訂僅限 dev/test 用途，正好對應本專案「測試展示、不對外提供服務」的定位
- 本專案月耗約 20–25 美元（以 PostgreSQL B1ms 為主），用量不到額度兩成

查證方式：`az rest --method get --url "https://management.azure.com/subscriptions?api-version=2020-01-01"`，
看 `subscriptionPolicies.quotaId`（`MSDN_2014-09-01` 為 credits 型）與 `spendingLimit`（`On` 表示不會超額計費）。

### 為什麼不用 SQLite

SQLite 本身沒問題，問題在於它需要**可寫入的持久磁碟**。
serverless 運算（Vercel、Cloud Run、Container Apps）的檔案系統唯讀且會在 cold start 重置，
要用 SQLite 就得改用自管 VM（例如 GCP 永久免費的 e2-micro），
等於把 OS 更新、TLS 憑證、反向代理、備份全部攬回來——對一個展示站不划算。

---

### 選項 1：Vercel 部署（早期展示站）

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

`netlify.toml` 與 Vercel 共用 `npm run build:deploy`。注意 `[build.environment]`
只在 build 期間有效、Functions runtime 讀不到，因此 `DATABASE_URL` 必須在
Netlify UI 的 Environment variables 設定。

### 選項 3：Azure 部署（正式平台）

```bash
# 安裝 Azure Developer CLI（若尚未安裝）
curl -fsSL https://aka.ms/install-azd.sh | bash

# 登入（azd 的登入狀態與 az CLI 各自獨立，兩個都要）
az login --tenant <你的租用戶>
azd auth login

# 指定目標訂閱（建議用專屬訂閱，方便獨立追蹤成本）
az account set --subscription <訂閱 ID>

# 建立 azd 環境並設定密鑰（不會進版控）
azd env new jujitsu-demo
azd env set POSTGRES_ADMIN_PASSWORD "$(openssl rand -base64 24)"
azd env set JWT_SECRET "$(openssl rand -base64 48)"

# 佈建並部署
azd up
```

`infra/main.bicep` 會建立：PostgreSQL Flexible Server（B1ms）、Container Apps 環境與
Container App、Container Registry、Storage Account 與 `uploads` 容器、Log Analytics、
以及一個具備 ACR Pull 與 Storage Blob Data Contributor 權限的受控識別。

**密鑰處理**：`postgresAdminPassword` 與 `jwtSecret` 都是 bicep 的 `@secure()` 參數，
由 azd 從環境變數帶入，不寫死在範本裡。連線字串也刻意不作為 output 輸出，
避免密碼出現在部署記錄中。

## 🔧 環境變數設定

部署前需要設定以下環境變數：

### 必要變數

- `DATABASE_URL`: PostgreSQL 連線字串（Azure 部署時由 bicep 自動注入）
- `JWT_SECRET`: 後台登入 JWT 的簽章密鑰。**未設定時程式會退回硬編碼預設值**，
  等同任何人都能自簽管理員 token，正式環境務必設定

### 選用變數

- `DIRECT_URL`: migration 專用連線字串，未設定時自動沿用 `DATABASE_URL`
- `AZURE_STORAGE_ACCOUNT_NAME` / `AZURE_STORAGE_CONTAINER_NAME`: 檔案上傳用。
  基礎設施已備妥，但 `src/lib/azure-storage.ts` 目前**尚未接線**，
  實際上傳仍寫入本機檔案系統（見下方限制說明）

### 郵件設定

SMTP 設定**存在資料庫的 `SystemConfig` 資料表**，不是環境變數，
由後台設定頁維護。`.env.example` 中的 `EMAIL_*` 變數實際上沒有被程式讀取。

## 🗄️ 資料庫

本專案使用 **PostgreSQL**（Prisma ORM）。早期版本使用 SQLite，但 serverless 平台的
檔案系統唯讀，導致單位註冊、選手報名、繳費上傳等寫入操作全部失敗，因此改接 Postgres。

連線字串由部署平台的環境變數提供，**不寫入版控**：

| 變數 | 用途 | 必填 |
|---|---|---|
| `DATABASE_URL` | 應用程式連線。serverless 環境請使用 pooled 連線字串 | ✅ |
| `DIRECT_URL` | migration 專用（unpooled）。Prisma 要求此變數必須存在；未設定時由建置腳本與容器啟動腳本以 `DATABASE_URL` 補上 | — |

`src/lib/prisma.ts` 刻意不提供任何預設值：缺少 `DATABASE_URL` 會在啟動時直接拋錯，
而不是靜默連到不存在的資料庫，避免「部署成功但整站 500」這種最難查的狀況。

### migration 在什麼時候執行

在 **容器啟動時**，由 `docker-entrypoint.sh` 執行，而不是 image 建構階段或 azd hook：

- 不能放 image 建構階段：`docker build` 時連不到任何資料庫
- 不能放 azd 的 `postdeploy` hook：該 hook 在本機執行，而 PostgreSQL 的防火牆規則
  只允許 Azure 服務連入（見 `infra/main.bicep` 的 `AllowAzureServices`）

啟動流程為 `prisma migrate deploy` → `init-db.js` → `seed-events.js`。
migration 失敗會中止啟動；兩支示範資料腳本皆為**冪等**，重複部署不會覆蓋既有資料。

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
