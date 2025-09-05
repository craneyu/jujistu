# 使用官方 Node.js 18 映像
FROM node:18-alpine AS base

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

# 使用 Azure PostgreSQL schema
COPY prisma/schema.azure.prisma prisma/schema.prisma

# 產生 Prisma 客戶端
RUN npx prisma generate

# 建構 Next.js 應用程式
RUN npm run build

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

# 複製 Prisma schema 和生成的客戶端
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
