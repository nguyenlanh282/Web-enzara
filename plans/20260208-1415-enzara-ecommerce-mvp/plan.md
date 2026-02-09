# Enzara E-Commerce Platform - Implementation Plan

**Version:** 1.0 | **Date:** 2026-02-08 | **Status:** Active
**Brand:** Enzara (eco-cleaning products, pineapple enzyme technology)
**Market:** Vietnamese, mobile-first | **Price range:** 50-85K VND

## Tech Stack Summary

- **Monorepo:** Turborepo + pnpm
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** NestJS, Prisma, PostgreSQL 16, Redis, BullMQ
- **Auth:** Passport.js JWT (Phase 1), migrate to better-auth (Phase 2+)
- **Storage:** Cloudflare R2, Sharp for image processing
- **Integrations:** SePay (QR payment), Pancake POS (order/inventory sync)

## Architecture

Single Next.js app with route groups `(storefront)` and `admin/`.
NestJS REST API. Prisma ORM with PostgreSQL. Redis for cache/queues.
Shared packages: `ui/`, `database/`, `types/`, `utils/`.

## Implementation Phases

### MVP (Phase 1) - 8-10 weeks

| # | Phase | Est. | Status | File |
|---|-------|------|--------|------|
| 01 | Project Setup & Infrastructure | 1 week | pending | [phase-01](./phase-01-project-setup.md) |
| 02 | Auth System & CMS Foundation | 1.5 weeks | pending | [phase-02](./phase-02-auth-and-cms.md) |
| 03 | Products & Storefront | 2 weeks | pending | [phase-03](./phase-03-products-and-storefront.md) |
| 04 | Cart, Checkout & Orders | 2 weeks | pending | [phase-04](./phase-04-cart-checkout-orders.md) |
| 05 | Blog & SEO | 1.5 weeks | pending | [phase-05](./phase-05-blog-and-seo.md) |

### Post-MVP (documented in PRD, not planned here)

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 2 - Engagement | GA4/Pixel, Chat, Reviews, Vouchers, Notifications | backlog |
| Phase 3 - Advanced | Flash Sale, Analytics, Shipping API, AI Chatbot | backlog |

## Key Decisions

1. Single Next.js app for storefront + admin (route groups, not separate apps)
2. Prisma over Drizzle -- DX wins at current scale; revisit at >10K concurrent users
3. Passport.js JWT for Phase 1 -- simpler initial setup, plan better-auth migration
4. Embla Carousel over Swiper -- 30KB vs 150KB, critical for VN mobile
5. Cloudflare R2 -- zero egress, Vietnam POPs in Hanoi and HCMC
6. Vietnamese slug generation with diacritics removal via `slugify`

## References

- PRD: `Z:\Web-enzara\Web-enzara-prd.md`
- Tech Stack: `Z:\Web-enzara\docs\tech-stack.md`
- Brand Research: `Z:\Web-enzara\docs\research-enzara-brand.md`
- VN Ecommerce Research: `Z:\Web-enzara\docs\research-vn-ecommerce.md`
- Tech Research: `Z:\Web-enzara\docs\research-tech-stack.md`
