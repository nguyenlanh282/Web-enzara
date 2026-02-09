# Enzara E-Commerce - Tech Stack

**Version:** 1.0 | **Date:** 2026-02-08

## Monorepo

| Tool | Purpose |
|------|---------|
| **Turborepo** | Task orchestration, caching |
| **pnpm** | Package manager (workspace protocol) |

## Frontend (Next.js)

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | App Router, SSR/SSG/ISR |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI components (Radix primitives) |
| **Zustand** | Client state (cart, auth, UI) |
| **TanStack Query v5** | Server state, caching |
| **React Hook Form + Zod** | Forms & validation |
| **Tiptap v2** | Rich text editor (admin CMS) |
| **Embla Carousel** | Sliders/carousels (lighter than Swiper) |
| **Framer Motion** | Animations |

## Backend (NestJS)

| Technology | Purpose |
|------------|---------|
| **NestJS** | REST API framework |
| **TypeScript** | Type safety |
| **Prisma** | ORM, migrations, type-safe queries |
| **PostgreSQL 16** | Primary database |
| **Redis** | Cache, sessions, rate-limiting |
| **BullMQ** | Job queues (email, sync, webhooks) |
| **Passport.js + JWT** | Authentication (upgrade to better-auth later) |
| **Sharp** | Image processing, WebP/AVIF conversion |
| **Multer + Cloudflare R2** | File upload & object storage |
| **Resend** | Transactional email |
| **Helmet + CORS** | Security headers |

## DevOps

| Technology | Purpose |
|------------|---------|
| **Docker + Compose** | Containerization |
| **GitHub Actions** | CI/CD pipelines |
| **Nginx** | Reverse proxy |
| **PM2** | Process manager |
| **Let's Encrypt** | SSL certificates |

## External Integrations

| Service | Purpose |
|---------|---------|
| **SePay** | QR banking payment (VietQR) |
| **Pancake POS** | Order/inventory sync |
| **GHN / GHTK** | Shipping fee calculation & tracking |
| **Cloudflare R2** | CDN + object storage (Vietnam POPs) |
| **Resend** | Email notifications |
| **Zalo OA** | Customer notifications |
| **Telegram Bot** | Admin order alerts |

## Project Structure

```
enzara/
├── apps/
│   ├── web/              # Next.js (Storefront + Admin)
│   └── api/              # NestJS Backend
├── packages/
│   ├── ui/               # Shared shadcn/ui components
│   ├── database/         # Prisma schema & migrations
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Shared utilities
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Key Decisions

1. **Single Next.js app** for both storefront and admin (route groups: `(storefront)` and `admin/`)
2. **Prisma over Drizzle** - better DX, migrations tooling; acceptable perf for current scale
3. **Passport.js initially** - plan migration to better-auth/Lucia in Phase 2
4. **Embla Carousel over Swiper** - 30KB vs 150KB bundle, better for VN mobile
5. **Cloudflare R2** - zero egress fees, Vietnam POPs in HN and HCMC
