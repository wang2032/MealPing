# ===== Build stage =====
FROM node:20-alpine AS builder
WORKDIR /repo

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile=false

# Copy source
COPY packages/shared packages/shared
COPY apps/server apps/server

# Build shared first, then generate Prisma client + build server
RUN pnpm --filter @mealping/shared run build
RUN pnpm --filter @mealping/server run db:generate
RUN pnpm --filter @mealping/server run build

# ===== Runtime stage =====
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

ENV NODE_ENV=production

COPY --from=builder /repo/package.json /repo/pnpm-workspace.yaml ./
COPY --from=builder /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder /repo/apps/server/package.json ./apps/server/package.json
COPY --from=builder /repo/apps/server/dist ./apps/server/dist
COPY --from=builder /repo/apps/server/prisma ./apps/server/prisma
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/server/node_modules ./apps/server/node_modules

WORKDIR /app/apps/server

EXPOSE 3000

# Run migrations on startup, then launch the API
CMD sh -c "npx prisma migrate deploy && node dist/main.js"
