# 2025年全國柔術錦標賽 - 報名系統

[![在線展示](https://img.shields.io/badge/在線展示-查看網站-blue)](https://your-demo-site.vercel.app)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/craneyu/jujistu)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/craneyu/jujistu)

## 系統概述

這是一個完整的柔術比賽線上報名系統，使用 Next.js 15、TypeScript、Tailwind CSS 和 Prisma ORM 建置。支援多種部署方式，可輕鬆部署到 Vercel、Netlify 或 Azure。

## 技術架構

- **Frontend**: Next.js 14 App Router, React, TypeScript
- **Styling**: Tailwind CSS 4.1
- **Database**: SQLite with Prisma ORM
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

## 使用流程

1. **單位註冊**：首先註冊報名單位，填寫單位名稱、聯絡人資訊
2. **選手註冊**：為單位新增選手，填寫個人資料、體重、段位等
3. **項目報名**：為每位選手選擇要參加的競賽項目
4. **繳費**：查看費用明細，填寫匯款資料
5. **確認**：系統確認報名並寄送確認信

## API 端點

- `POST /api/units/register` - 單位註冊
- `GET/POST /api/athletes` - 選手管理
- `GET/POST/DELETE /api/registrations` - 項目報名管理
- `GET/POST /api/payments` - 繳費管理

## 部署建議

1. 使用 Vercel 部署（推薦）
2. 設定生產環境的環境變數
3. 使用更安全的資料庫（如 PostgreSQL）替代 SQLite
4. 設定 HTTPS
5. 實作完整的身份驗證系統

## 待優化項目

- [ ] 實作完整的登入系統與 session 管理
- [ ] 新增 Email 通知功能
- [ ] 實作管理後台
- [ ] 新增報表匯出功能
- [ ] 優化手機版介面
- [ ] 新增多語言支援

## 授權

此系統為 2025年全國柔術錦標賽專用報名系統。