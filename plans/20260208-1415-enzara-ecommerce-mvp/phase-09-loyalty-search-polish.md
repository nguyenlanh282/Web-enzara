# Phase 09 - Loyalty Points, Search Enhancement & Polish

## Context Links

- [Master Plan](./plan.md)
- [Previous: User Experience](./phase-08-user-experience.md)
- [PRD Module 6.3: Loyalty Points](../Web-enzara-prd.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Priority** | High |
| **Status** | Active |
| **Depends on** | Phase 08 (User Experience) |

## Scope

### Task 1: Loyalty Points System
- Backend: LoyaltyModule (controller, service, DTOs) inside `modules/loyalty/`
- Endpoints:
  - `GET /loyalty/balance` - Current points + tier info
  - `GET /loyalty/history` - Paginated points history
  - `POST /loyalty/redeem` - Redeem points for discount (1000 points = 10,000 VND)
- Auto-earn logic (called from OrdersService when order is DELIVERED):
  - Purchase: 1% of order value = points (e.g., 500,000 VND = 50 points)
  - Tier multiplier: Bac 1x, Vang 1.5x, Kim Cuong 2x
- Tiers (calculated from total earned points):
  - Bac: 0 - 999 points
  - Vang: 1,000 - 4,999 points (1.5x earn rate)
  - Kim Cuong: 5,000+ points (2x earn rate + free ship)
- Review earn: +50 points when review approved (called from ReviewsService)
- Register earn: +100 points on signup (called from AuthService)
- Account page: `/account/loyalty` - balance, tier progress bar, history table
- Checkout integration: Option to apply points as discount
- Admin: Add "Loyalty" nav under Marketing in AdminSidebar
- Register WishlistModule in app.module.ts

### Task 2: Enhanced Search
- Upgrade `searchProducts` to search across name + description + SKU fields
- Add pagination support to search endpoint
- Storefront: Search bar in header with instant suggestions (debounced API call)
- Search results page: `/search` - improve with filters (category, price range, sort)
- Search autocomplete dropdown component

### Task 3: Storefront Polish
- Header: Sticky header on scroll, mobile hamburger menu improvements
- Footer: Proper footer with links, contact info, social media
- 404 page: Custom not-found page
- Loading states: Skeleton loaders for product cards, product detail
- Error boundaries: Graceful error handling for API failures
- Toast notifications: Success/error feedback for cart, wishlist, auth actions

## Prisma Model (already defined)

```
model LoyaltyPoint {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  points      Int
  type        String   // EARN, REDEEM, EXPIRE
  description String
  orderId     String?  @map("order_id")
  expiresAt   DateTime? @map("expires_at")
  createdAt   DateTime @default(now()) @map("created_at")
  user        User     @relation(fields: [userId], references: [id])
  @@index([userId])
  @@map("loyalty_points")
}
```
