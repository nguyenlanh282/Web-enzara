# ── Stage 1: base ─────────────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Stage 2: deps ─────────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 3: build ────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/utils/node_modules ./packages/utils/node_modules

COPY packages/database ./packages/database
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY apps/api ./apps/api
COPY turbo.json package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build NestJS
RUN cd apps/api && npx nest build

# ── Stage 4: production ──────────────────────────────────────
FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages/database ./packages/database
COPY --from=build /app/packages/types ./packages/types
COPY --from=build /app/packages/utils ./packages/utils
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "cd /app/packages/database && npx prisma migrate deploy && cd /app && node apps/api/dist/main.js"]
