# ── Stage 1: Base ──────────────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Stage 2: Builder ──────────────────────────────────────────
FROM base AS builder

# Copy workspace config first for better layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy only the package.json files we need (for dependency install caching)
COPY apps/api/package.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/ui/package.json ./packages/ui/

# Install all dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# Copy the full source
COPY packages/database/ ./packages/database/
COPY packages/types/ ./packages/types/
COPY packages/utils/ ./packages/utils/
COPY packages/ui/ ./packages/ui/
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN pnpm --filter @enzara/database db:generate

# Build the API
RUN pnpm --filter @enzara/api build

# ── Stage 3: Production runner ────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built output and dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/database/prisma ./prisma
COPY --from=builder /app/packages/database/node_modules/.prisma ./node_modules/.prisma

USER nestjs

EXPOSE 4000

CMD ["node", "dist/main.js"]
