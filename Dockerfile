# ── Stage 1: base ─────────────────────────────────────────────
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Stage 2: deps (all workspace deps) ──────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 3: build-api ──────────────────────────────────────
FROM base AS build-api
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

RUN cd packages/database && npx prisma generate
RUN cd apps/api && npx nest build

# ── Stage 4: build-web ──────────────────────────────────────
FROM base AS build-web
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/utils/node_modules ./packages/utils/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules

COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY packages/ui ./packages/ui
COPY apps/web ./apps/web
COPY turbo.json package.json pnpm-workspace.yaml pnpm-lock.yaml ./

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN cd apps/web && npx next build

# ── Stage 5: production ────────────────────────────────────
FROM node:22-alpine AS production
RUN apk add --no-cache libc6-compat nginx

WORKDIR /app

# Install pnpm for API deps
RUN corepack enable && corepack prepare pnpm@9 --activate

# ── API setup ──
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
RUN pnpm install --frozen-lockfile --prod=false

# Copy prisma schema and generate client
COPY --from=build-api /app/packages/database/prisma ./packages/database/prisma
COPY --from=build-api /app/packages/database/index.ts ./packages/database/index.ts
COPY --from=build-api /app/packages/database/tsconfig.json ./packages/database/tsconfig.json
RUN cd packages/database && npx prisma generate

# Copy API build artifacts and workspace sources
COPY --from=build-api /app/apps/api/dist ./apps/api/dist
COPY --from=build-api /app/packages/types/src ./packages/types/src
COPY --from=build-api /app/packages/types/tsconfig.json ./packages/types/tsconfig.json
COPY --from=build-api /app/packages/utils/src ./packages/utils/src
COPY --from=build-api /app/packages/utils/tsconfig.json ./packages/utils/tsconfig.json

# ── Web setup ──
COPY --from=build-web /app/apps/web/.next/standalone ./web-standalone/
COPY --from=build-web /app/apps/web/.next/static ./web-standalone/apps/web/.next/static
COPY --from=build-web /app/apps/web/public ./web-standalone/apps/web/public

# ── Nginx config ──
COPY nginx/default.conf /etc/nginx/http.d/default.conf

# ── Entrypoint script ──
RUN printf '#!/bin/sh\nset -e\necho "Running prisma migrate deploy..."\ncd /app/packages/database && npx prisma migrate deploy\necho "Starting API..."\ncd /app && node apps/api/dist/main.js &\necho "Starting Web..."\ncd /app/web-standalone && HOSTNAME=0.0.0.0 node apps/web/server.js &\necho "Starting nginx..."\nnginx -g "daemon off;"\n' > /app/start.sh && chmod +x /app/start.sh

ENV NODE_ENV=production
EXPOSE 80

CMD ["/app/start.sh"]
