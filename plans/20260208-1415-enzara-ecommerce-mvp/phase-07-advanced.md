# Phase 07 - Advanced Features

## Context Links

- [Master Plan](./plan.md)
- [Previous: Engagement](./phase-06-engagement.md)
- [PRD Module 7.1: Flash Sale](../Web-enzara-prd.md)
- [PRD Module 7.3: Analytics Dashboard](../Web-enzara-prd.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Priority** | High |
| **Status** | Active |
| **Depends on** | Phase 06 (Engagement) |

## Scope

### Task 1: Flash Sale Backend + Admin
- Extend `MarketingModule` with FlashSaleController + FlashSaleService
- CRUD endpoints: create, list, get, update, delete flash sales
- Add/remove items to flash sale with sale prices + quantities
- Auto-active check: only return flash sales where `startTime <= now <= endTime && isActive`
- Admin page: `/admin/flash-sales` - list, create/edit modal, add products
- Add "Flash Sale" nav item under Marketing in AdminSidebar
- DTOs: CreateFlashSaleDto, UpdateFlashSaleDto, FlashSaleFilterDto, AddFlashSaleItemDto

### Task 2: Flash Sale Storefront
- Public endpoint: `GET /flash-sales/active` - returns current active flash sale with items (products + images)
- `FlashSaleWidget` component - countdown timer, product grid with progress bars (soldCount/quantity)
- Add FlashSaleWidget to homepage between hero and categories
- On product detail: show flash sale price if product is in active flash sale

### Task 3: Analytics Dashboard Backend + Admin
- Backend: `AnalyticsController` + `AnalyticsService` in a new analytics module
- Endpoints:
  - `GET /analytics/overview` - total orders, revenue, customers, products (with period comparison)
  - `GET /analytics/revenue` - daily/weekly/monthly revenue data (for line chart)
  - `GET /analytics/orders-by-status` - order counts grouped by status (for bar/pie chart)
  - `GET /analytics/top-products` - top 10 by revenue and by quantity (for table)
  - `GET /analytics/recent-orders` - latest 10 orders (for feed)
- Admin: rewrite `/admin/dashboard` with real data + Recharts charts
  - Stats cards with real numbers + period comparison (vs last 30 days)
  - Revenue line chart (last 30 days)
  - Orders by status bar chart
  - Top products table
  - Recent orders feed
- Install `recharts` package in web app

## Prisma Models (already defined)

```
model FlashSale {
  id, name, startTime, endTime, isActive, createdAt
  items FlashSaleItem[]
}

model FlashSaleItem {
  id, flashSaleId, productId, salePrice (Decimal 12,0), quantity, soldCount
  flashSale FlashSale, product Product
  @@unique([flashSaleId, productId])
}
```

## Deferred (requires external API keys)

- Module 7.4: Shipping Integration (GHN/GHTK) - needs API credentials
- Module 7.5: AI Chatbot (Claude API) - needs API key + more complex integration
- Module 7.2: Upsell & Cross-sell - data-driven, needs order history data first
