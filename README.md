# 2025 年全國柔術錦標賽 - 報名系統

[![在線展示](https://img.shields.io/badge/在線展示-查看網站-blue)](https://jujistu-craneyuniuedutws-projects.vercel.app)

線上展示：<https://jujistu-craneyuniuedutws-projects.vercel.app>

> ⚠️ 線上版本是**展示用**的：Vercel 的 serverless 檔案系統唯讀，SQLite 資料庫
> 是在建置階段產生後打包進去的，因此頁面瀏覽與資料讀取正常，但單位註冊、
> 選手報名、繳費上傳等**寫入操作會失敗**。
> 要開放寫入需改接 Postgres，步驟見 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 系統概述

這是一個完整的柔術比賽線上報名系統，使用 Next.js 15、TypeScript、Tailwind CSS 和 Prisma ORM 建置。支援多種部署方式，可輕鬆部署到 Vercel、Netlify 或 Azure。

## 技術架構

- **Frontend**: Next.js 15 App Router, React, TypeScript
- **Styling**: Tailwind CSS 4.1
- **Database**: SQLite with Prisma ORM（檔案型資料庫，部署簡單）
- **Form Validation**: React Hook Form + Zod
- **UI Components**: Radix UI
- **Authentication**: bcryptjs for password hashing

## 功能特色

### 1. 報名單位管理

- 單位註冊與登入
- 聯絡人資料管理
- 密碼加密儲存

### 2. 選手註冊管理

- 完整的選手資料登錄
- 自動計算年齡組別（成人組、青年組、青少年組、兒童組、大師組）
- 大師組自動分類（M1、M2、M3）
- 段位管理（白帶至黑帶）
- 文件上傳（選手照片、教練證、同意書）

### 3. 競賽項目報名

- 支援多項目報名：
  - 對打 (Fighting)
  - 寢技 (Ne-Waza)
  - 格鬥 (Full Contact)
  - 演武 (Duo)
  - 無道袍 (No-Gi)
- 自動體重級別分配
- 項目適用性檢查（依年齡組別）

### 4. 繳費管理

- 自動計算報名費用（每項 NT$1,000）
- 匯款資料填寫
- 繳費狀態追蹤
- 匯款證明上傳

### 5. 體重級別管理

- 完整的體重級別資料庫
- 依年齡組別、性別、項目自動分配
- 支援所有組別的體重分級

## 安裝與執行

### 前置需求

- Node.js 18+
- npm 或 yarn

### 安裝步驟

1. 安裝相依套件：

```bash
npm install
```

2. 設定環境變數：
   編輯 `.env` 檔案，設定必要的環境變數

3. 初始化資料庫：

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

4. 啟動開發伺服器：

```bash
npm run dev
```

5. 開啟瀏覽器訪問：

```
http://localhost:3000
```

## 資料庫架構

- **RegistrationUnit**: 報名單位
- **Athlete**: 選手資料
- **Registration**: 項目報名記錄
- **Payment**: 繳費記錄
- **EventCategory**: 競賽項目設定
- **SystemConfig**: 系統設定

## 🚀 快速開始

### 簡單 3 步驟部署

```bash
# 1. 複製專案（repo 根目錄就是專案本身，不需要再進子目錄）
git clone https://github.com/craneyu/jujistu.git
cd jujistu

# 2. 一鍵設定
./setup.sh

# 3. 啟動服務
npm run dev
```

### 或使用一鍵部署按鈕

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/craneyu/jujistu)

**💡 SQLite 讓部署變得超簡單 — 無需設定外部資料庫。**
但請注意 serverless 平台的檔案系統唯讀，線上版本只能讀不能寫（見上方說明）。

## 使用流程

1. **單位註冊**：教練或道館註冊帳戶
2. **選手註冊**：為單位新增選手，填寫個人資料、體重、段位等
3. **項目報名**：為每位選手選擇要參加的競賽項目
4. **繳費**：查看費用明細，填寫匯款資料
5. **確認**：系統確認報名並寄送確認信

## 🗄️ 資料庫優勢

**為什麼選擇 SQLite？**

✅ **零設定**: 檔案型資料庫，複製即用  
✅ **免費部署**: 無需付費資料庫服務  
✅ **高效能**: 讀取速度比網路資料庫更快  
✅ **可攜性**: 整個資料庫就是一個檔案  
✅ **簡單備份**: 複製檔案即可備份

## API 端點

- `POST /api/units/register` - 單位註冊
- `GET/POST /api/athletes` - 選手管理
- `GET/POST/DELETE /api/registrations` - 項目報名管理
- `GET/POST /api/payments` - 繳費管理

## 🌟 部署建議

1. ✅ 使用 Vercel/Netlify 一鍵部署
2. ✅ SQLite 資料庫已內建，無需額外設定
3. ✅ 支援檔案上傳到 Azure Storage
4. ✅ 自動 HTTPS 加密
5. ✅ 預設管理員帳戶自動建立

## 待優化項目

- [ ] 實作完整的登入系統與 session 管理
- [ ] 新增 Email 通知功能
- [ ] 實作管理後台
- [ ] 新增報表匯出功能
- [ ] 優化手機版介面
- [ ] 新增多語言支援

## 授權

此系統為 2025 年全國柔術錦標賽專用報名系統。
