# Node 版本與 netlify.toml、CI 一致
FROM node:22-alpine AS base

# 安裝相依性
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 複製 package files
COPY package.json package-lock.json* ./
RUN npm ci

# 建構應用程式
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# prisma/schema.prisma 本身已是 PostgreSQL，不需要再替換成其他 schema。
# （原本這裡會蓋成 schema.azure.prisma，但那是一套與程式碼不相符的舊資料模型，
#   會導致 API 找不到對應的 model，該檔案已移除。）

# Prisma 要求 schema 內 env() 參照的變數必須存在，即使 generate 不會真的連線。
# 這裡給的是建構期間的佔位值，實際連線字串由 Container App 的環境變數提供。
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN npx prisma generate

# 只做編譯。不使用 npm run build，因為該指令包含 prisma migrate deploy
# 與 seed，而 image 建構階段連不到任何資料庫。
# migration 改在容器啟動時由 docker-entrypoint.sh 執行。
RUN npx next build

# 生產環境映像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 複製建構檔案
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 複製 Prisma schema、migrations 與生成的客戶端
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 啟動時要跑 migration，因此需要 prisma CLI。
#
# CLI 安裝在 /opt/prisma 這個獨立目錄，不與 /app/node_modules 混用：
# standalone 的 node_modules 只含應用程式追蹤到的相依，其中的 @prisma/config
# 缺少 CLI 需要的依賴樹；若裝在同一層，npm 會因為版本相同而跳過安裝，
# 啟動時就會出現 MODULE_NOT_FOUND。版本需與 @prisma/client 一致。
RUN mkdir -p /opt/prisma \
    && cd /opt/prisma \
    && npm init -y > /dev/null \
    && npm install prisma@6.15.0 --no-audit --no-fund

COPY --from=builder /app/scripts ./scripts

# scripts/init-db.js 是獨立執行的 node 腳本，不經過 Next.js 打包。
# standalone 的 node_modules 只保留無法被打包的相依，bcryptjs 已被打包進
# .next 的 chunks，因此獨立腳本 require 時會 MODULE_NOT_FOUND，必須另外複製。
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
