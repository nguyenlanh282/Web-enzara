# Phase 06 - Engagement & Marketing

## Context Links

- [Master Plan](./plan.md)
- [Previous: Blog & SEO](./phase-05-blog-and-seo.md)
- [PRD Module 6.1: Tracking](../Web-enzara-prd.md)
- [PRD Module 6.2: Reviews](../Web-enzara-prd.md)
- [PRD Module 6.3: Vouchers & Loyalty](../Web-enzara-prd.md)
- [PRD Module 6.4: Notifications](../Web-enzara-prd.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Priority** | High |
| **Status** | Active |
| **Depends on** | Phase 05 (Blog & SEO) |

## Scope

### Task 1: Tracking Infrastructure
- `lib/tracking.ts` - TrackingService class (GA4, Facebook Pixel, TikTok Pixel)
- `TrackingScripts` component - loads scripts from CMS settings (tracking group)
- Admin tracking settings page update
- Integrate tracking into: product view, add to cart, begin checkout, purchase

### Task 2: Chat Widget + Floating Contacts
- `ChatWidget` component - Zalo Chat, Messenger from CMS settings (chat group)
- `FloatingContacts` component - configurable buttons from CMS settings (contacts group)
- Add both to storefront layout

### Task 3: Reviews System
- Backend: reviews module (NestJS) - submit, moderate, display, reply
- Admin: reviews moderation page
- Storefront: ReviewSection on product detail (rating summary, review list, submit form)
- Only allow review if purchased + DELIVERED

### Task 4: Voucher Admin + Notifications
- Admin: voucher CRUD management page (Voucher model already in schema + validation in orders)
- Backend: notifications module (email via Resend, Telegram bot for admin)
- Email templates: order confirmation, shipping update, delivery, cancellation
- Telegram bot: new order, payment success, low stock alerts
- Integrate notifications into order status changes

## Prisma Models (already defined)

```
model Review {
  id, productId, userId, orderId?, rating (Int), content?, images (String[]),
  isApproved (default false), adminReply?, createdAt, updatedAt
  product Product, user User
  @@unique([productId, userId, orderId])
}

model Voucher {
  id, code (unique), name, description?, type (VoucherType), value (Decimal),
  minOrderAmount?, maxDiscount?, usageLimit?, usedCount, perUserLimit,
  startDate, endDate, isActive, createdAt
  orders Order[]
}

model LoyaltyPoint {
  id, userId, points (Int), type, description, orderId?, expiresAt?, createdAt
  user User
}

model NotificationLog {
  id, channel, recipient, subject?, content (Text), status, metadata (Json?), createdAt
}
```

## CMS Settings Groups

### tracking group
```json
{
  "google_analytics_id": "G-XXXXXXXXXX",
  "google_tag_manager_id": "GTM-XXXXXXX",
  "facebook_pixel_id": "1234567890",
  "tiktok_pixel_id": "CXXXXXXXXX",
  "custom_head_scripts": "",
  "custom_body_scripts": ""
}
```

### chat group
```json
{
  "zalo_chat": { "enabled": true, "oa_id": "1234567890" },
  "messenger_chat": { "enabled": true, "page_id": "123456789" }
}
```

### contacts group
```json
{
  "enabled": true,
  "position": "right",
  "items": [
    { "id": "phone", "type": "phone", "label": "Hotline", "value": "0900000000", "icon": "phone", "color": "#25D366", "enabled": true, "sort_order": 1 },
    { "id": "zalo", "type": "zalo", "label": "Chat Zalo", "value": "0900000000", "icon": "message-circle", "color": "#0068FF", "enabled": true, "sort_order": 2 }
  ]
}
```
