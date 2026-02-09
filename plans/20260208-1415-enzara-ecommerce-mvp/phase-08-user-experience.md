# Phase 08 - User Experience & Personalization

## Context Links

- [Master Plan](./plan.md)
- [Previous: Advanced](./phase-07-advanced.md)
- [PRD Module 7.2: Upsell & Cross-sell](../Web-enzara-prd.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Priority** | High |
| **Status** | Active |
| **Depends on** | Phase 07 (Advanced) |

## Scope

### Task 1: Wishlist System
- Backend: Wishlist module (add, remove, list, check) - Prisma model already exists
- Storefront: Heart toggle on ProductCard + product detail page
- Account: Wishlist page at `/account/wishlist`

### Task 2: User Profile + Address Book
- Backend: Profile update (PATCH), Address CRUD endpoints
- Account sidebar navigation component (shared layout for account pages)
- Profile page: `/account/profile` - view/edit name, email, phone, password
- Address book: `/account/addresses` - list, add, edit, delete, set default

### Task 3: Cross-sell & Cart Suggestions
- Backend: Suggestions endpoint (co-purchased products + same category fallback)
- Product page: "Khach hang cung mua" section
- Cart page: "Mua them X de duoc free ship" suggestion when subtotal < 500,000d

## Prisma Models (already defined)

```
model Wishlist {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  productId String   @map("product_id")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@unique([userId, productId])
  @@map("wishlists")
}

model Address {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  fullName  String   @map("full_name")
  phone     String
  address   String
  ward      String
  district  String
  province  String
  isDefault Boolean  @default(false) @map("is_default")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("addresses")
}
```
