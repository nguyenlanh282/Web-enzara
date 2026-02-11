# ── Stage 1: base ─────────────────────────────────────────────
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
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
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copy package files and install ALL deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
RUN pnpm install --frozen-lockfile --prod=false

# Copy prisma schema and generate client
COPY --from=build /app/packages/database/prisma ./packages/database/prisma
COPY --from=build /app/packages/database/index.ts ./packages/database/index.ts
COPY --from=build /app/packages/database/tsconfig.json ./packages/database/tsconfig.json
RUN cd packages/database && npx prisma generate

# Copy build artifacts and workspace package sources
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/types/src ./packages/types/src
COPY --from=build /app/packages/types/tsconfig.json ./packages/types/tsconfig.json
COPY --from=build /app/packages/utils/src ./packages/utils/src
COPY --from=build /app/packages/utils/tsconfig.json ./packages/utils/tsconfig.json

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
