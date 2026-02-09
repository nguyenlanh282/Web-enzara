# Phase 01 - Project Setup & Infrastructure

## Context Links

- [Master Plan](./plan.md)
- [Next Phase: Auth & CMS](./phase-02-auth-and-cms.md)
- [PRD Section 2: Architecture](../Web-enzara-prd.md)
- [Tech Stack](../docs/tech-stack.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-08 |
| **Priority** | Critical |
| **Status** | Pending |
| **Estimated** | 1 week |
| **Depends on** | Nothing |
| **Blocks** | All subsequent phases |

## Key Insights

- Turborepo + pnpm workspaces for monorepo orchestration with remote caching
- Single Next.js app serves both storefront (`(storefront)` route group) and admin (`admin/` routes)
- NestJS backend as separate app in monorepo
- Shared packages for UI, database (Prisma), types, and utilities
- Docker Compose for local dev (PostgreSQL 16, Redis 7)
- GitHub Actions for CI with Turborepo cache integration

## Requirements

1. Initialize Turborepo monorepo with pnpm workspaces
2. Scaffold Next.js 15 app with App Router, TypeScript, Tailwind CSS
3. Scaffold NestJS API with TypeScript
4. Create shared packages: `database`, `types`, `utils`, `ui`
5. Configure Prisma schema with PostgreSQL
6. Docker Compose for PostgreSQL + Redis
7. ESLint + Prettier shared configs
8. Environment variable management (.env files)
9. Basic GitHub Actions CI pipeline

## Architecture

```
enzara/
├── apps/
│   ├── web/                    # Next.js 15 (Storefront + Admin)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (storefront)/    # Public routes
│   │   │   │   ├── admin/           # CMS admin routes
│   │   │   │   ├── api/             # BFF API routes
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── stores/
│   │   │   └── types/
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                    # NestJS Backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── modules/
│       │   ├── common/
│       │   └── config/
│       ├── prisma/             # NOTE: also referenced via packages/database
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── database/               # Prisma schema, client, migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── index.ts
│   │   └── package.json
│   ├── types/                  # Shared TypeScript types/interfaces
│   │   ├── src/
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   ├── user.ts
│   │   │   ├── blog.ts
│   │   │   ├── settings.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── utils/                  # Shared utility functions
│   │   ├── src/
│   │   │   ├── slug.ts         # Vietnamese slug generation
│   │   │   ├── currency.ts     # VND formatting
│   │   │   ├── date.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── ui/                     # Shared shadcn/ui components
│       ├── src/
│       │   └── components/
│       ├── tailwind.config.ts
│       └── package.json
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .github/
    └── workflows/
        └── ci.yml
```

## Related Code Files

After this phase, these files will exist:

- `enzara/turbo.json` -- Turborepo pipeline config
- `enzara/pnpm-workspace.yaml` -- workspace definitions
- `enzara/package.json` -- root package with scripts
- `enzara/docker-compose.yml` -- PostgreSQL 16 + Redis 7
- `enzara/.env.example` -- environment variable template
- `enzara/apps/web/package.json` -- Next.js dependencies
- `enzara/apps/web/src/app/layout.tsx` -- root layout with SVN-Gilroy font
- `enzara/apps/web/tailwind.config.ts` -- Enzara brand colors + font
- `enzara/apps/api/package.json` -- NestJS dependencies
- `enzara/apps/api/src/main.ts` -- NestJS bootstrap
- `enzara/packages/database/prisma/schema.prisma` -- full Prisma schema
- `enzara/.github/workflows/ci.yml` -- CI pipeline

## Implementation Steps

### 1. Initialize monorepo root

Create root `package.json`, `pnpm-workspace.yaml`, `turbo.json`.

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "db:generate": { "cache": false },
    "db:push": { "cache": false }
  }
}
```

### 2. Create Docker Compose for local services

```yaml
# docker-compose.yml
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: enzara
      POSTGRES_PASSWORD: enzara_dev
      POSTGRES_DB: enzara_db
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 3. Scaffold Next.js 15 app (`apps/web`)

```bash
cd apps && pnpm create next-app web --typescript --tailwind --eslint --app --src-dir
```

Configure `tailwind.config.ts` with Enzara brand tokens:

```typescript
// apps/web/tailwind.config.ts
const config = {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: { DEFAULT: "#738136", dark: "#626c13" },
          orange: { DEFAULT: "#de8d1e" },
          yellow: { DEFAULT: "#ffcc48" },
        },
      },
      fontFamily: {
        sans: ["var(--font-gilroy)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        enzara: "12px",  // 10-20px rounded corners per brand
      },
    },
  },
};
```

Install core frontend deps:

```bash
pnpm add zustand @tanstack/react-query react-hook-form zod @hookform/resolvers
pnpm add embla-carousel-react framer-motion @tiptap/react @tiptap/starter-kit
pnpm add -D @types/node
```

Initialize shadcn/ui:

```bash
npx shadcn@latest init
```

### 4. Create root layout with SVN-Gilroy font

```tsx
// apps/web/src/app/layout.tsx
import localFont from "next/font/local";

const gilroy = localFont({
  src: [
    { path: "../fonts/SVN-Gilroy-Regular.woff2", weight: "400" },
    { path: "../fonts/SVN-Gilroy-SemiBold.woff2", weight: "600" },
    { path: "../fonts/SVN-Gilroy-Bold.woff2", weight: "700" },
  ],
  variable: "--font-gilroy",
});

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={gilroy.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

### 5. Create route group stubs

```
apps/web/src/app/(storefront)/layout.tsx    -- storefront shell
apps/web/src/app/(storefront)/page.tsx      -- homepage placeholder
apps/web/src/app/admin/layout.tsx           -- admin shell (protected)
apps/web/src/app/admin/dashboard/page.tsx   -- admin dashboard placeholder
```

### 6. Scaffold NestJS API (`apps/api`)

```bash
cd apps && nest new api --package-manager pnpm --skip-git
```

Install backend deps:

```bash
pnpm add @nestjs/config @nestjs/passport passport passport-jwt
pnpm add @prisma/client bcrypt class-validator class-transformer
pnpm add ioredis @nestjs/bull bullmq sharp multer
pnpm add helmet @nestjs/throttler
pnpm add -D prisma @types/passport-jwt @types/bcrypt @types/multer
```

Configure `main.ts`:

```typescript
// apps/api/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT || 4000);
}
```

### 7. Create `packages/database` with full Prisma schema

Copy the complete Prisma schema from the PRD (Section 4.2) into `packages/database/prisma/schema.prisma`. This includes all models: User, Address, Category, Brand, Product, ProductVariant, ProductImage, Wishlist, Order, OrderItem, OrderTimeline, PostCategory, Post, Comment, Review, Voucher, FlashSale, FlashSaleItem, LoyaltyPoint, Setting, Page, Media, Banner, Menu, Redirect, NotificationLog.

Export the Prisma client:

```typescript
// packages/database/index.ts
export * from "@prisma/client";
export { PrismaClient } from "@prisma/client";
```

### 8. Create `packages/types` with shared interfaces

Minimal initial types matching the Prisma schema. These will expand as features are built.

### 9. Create `packages/utils`

```typescript
// packages/utils/src/slug.ts
export function generateSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove Vietnamese diacritics
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// packages/utils/src/currency.ts
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND",
  }).format(amount);
}
```

### 10. Create environment variable template

```bash
# .env.example
# Database
DATABASE_URL="postgresql://enzara:enzara_dev@localhost:5432/enzara_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="change-me-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
FRONTEND_URL="http://localhost:3000"

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="enzara-media"
R2_PUBLIC_URL=""

# SePay
SEPAY_API_KEY=""
SEPAY_WEBHOOK_SECRET=""

# Pancake POS
PANCAKE_API_URL="https://pos.pancake.vn/api/v1"
PANCAKE_API_KEY=""
PANCAKE_SHOP_ID=""
PANCAKE_WEBHOOK_SECRET=""

# Email (Resend)
RESEND_API_KEY=""
```

### 11. Setup GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run build
```

### 12. Run initial Prisma migration

```bash
cd packages/database
pnpm prisma generate
pnpm prisma migrate dev --name init
```

### 13. Create seed script

```typescript
// packages/database/prisma/seed.ts
// Seed admin user, default settings, sample categories
// Admin: admin@enzara.vn / password (bcrypt hashed)
// Settings: general group with Enzara brand defaults
// Categories: based on Enzara product lines
```

### 14. Verify full dev workflow

```bash
docker compose up -d          # start PostgreSQL + Redis
pnpm install                  # install all deps
pnpm db:generate              # generate Prisma client
pnpm db:push                  # push schema to DB
pnpm dev                      # start all apps in parallel
# web: http://localhost:3000
# api: http://localhost:4000/api
```

## Todo List

- [ ] Init Turborepo monorepo with `pnpm-workspace.yaml` and `turbo.json`
- [ ] Create `docker-compose.yml` with PostgreSQL 16 + Redis 7
- [ ] Scaffold `apps/web` (Next.js 15 + TypeScript + Tailwind)
- [ ] Configure Tailwind with Enzara brand colors and SVN-Gilroy font
- [ ] Initialize shadcn/ui in web app
- [ ] Create root layout with Vietnamese lang + font variable
- [ ] Create `(storefront)` and `admin/` route group stubs
- [ ] Scaffold `apps/api` (NestJS)
- [ ] Configure NestJS main.ts (CORS, validation, helmet, prefix)
- [ ] Create `packages/database` with full Prisma schema from PRD
- [ ] Create `packages/types` with shared TypeScript interfaces
- [ ] Create `packages/utils` with slug generator and VND formatter
- [ ] Create `packages/ui` stub for shared shadcn components
- [ ] Create `.env.example` with all environment variables
- [ ] Setup `.github/workflows/ci.yml`
- [ ] Run initial Prisma migration
- [ ] Create database seed script (admin user, default settings)
- [ ] Verify full dev workflow end-to-end

## Success Criteria

1. `pnpm dev` starts both Next.js (port 3000) and NestJS (port 4000) concurrently
2. `docker compose up` provisions PostgreSQL and Redis without errors
3. Prisma schema compiles and migrations run against PostgreSQL
4. Next.js renders placeholder pages at `/` and `/admin/dashboard`
5. NestJS responds at `GET /api/health` with 200 OK
6. Tailwind renders with Enzara brand colors and SVN-Gilroy font
7. `pnpm build` succeeds in CI without errors
8. Shared packages (`database`, `types`, `utils`) importable from both apps

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SVN-Gilroy font files missing/unlicensed | High | Confirm font files exist; fallback to system-ui |
| Prisma schema too large for initial migration | Low | Split migration if needed; schema is well-defined in PRD |
| pnpm workspace resolution conflicts | Medium | Pin dependency versions; use `catalog:` protocol |
| Docker not available on dev machine | Low | Provide cloud DB connection strings as alternative |

## Security Considerations

- `.env` files in `.gitignore` -- never committed
- Docker services bind to `localhost` only in dev
- No secrets in `turbo.json` or `package.json`
- Prisma connection uses environment variables only

## Next Steps

After this phase completes, proceed to [Phase 02 - Auth & CMS](./phase-02-auth-and-cms.md).
