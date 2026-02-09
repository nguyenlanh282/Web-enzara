# Phase 13 - Newsletter, Image Optimization, Order Tracking & Polish

## Context Links

- [Master Plan](./plan.md)
- [Previous: Voucher, Recently Viewed, Email Verify](./phase-12-voucher-checkout-recently-viewed-email-verify.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Priority** | High |
| **Status** | Active |
| **Depends on** | Phase 12 |

## Scope

### Task 1: Newsletter API + Contact Page + Social Share
- Backend: Newsletter subscribe endpoint (POST /api/newsletter/subscribe) — store in Setting table
- Frontend: Wire Newsletter.tsx to real API
- Contact page: `/lien-he` with form (name, email, phone, message) — store submissions in Setting table
- Social share buttons on product detail page (Facebook, Zalo, copy link)

### Task 2: Image Optimization with Sharp
- Modify MediaService.upload() to process images through Sharp
- Auto-resize large images (max 1920px width)
- Generate WebP version alongside original
- Generate thumbnail (400px width)
- Compress JPEG/PNG quality
- Store optimized URLs in Media record

### Task 3: Order Tracking Page + Homepage Testimonials
- Public order tracking page: `/theo-doi-don-hang` — input order number, shows order status timeline
- Uses existing API: GET /api/orders/:orderNumber/tracking
- Homepage testimonials section: Show top-rated approved reviews with customer names
- Backend: Add endpoint to get featured reviews for homepage
