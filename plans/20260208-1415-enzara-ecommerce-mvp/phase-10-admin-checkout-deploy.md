# Phase 10 - Admin Features, Checkout Enhancement & Production Setup

## Context Links

- [Master Plan](./plan.md)
- [Previous: Loyalty, Search, Polish](./phase-09-loyalty-search-polish.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Priority** | High |
| **Status** | Active |
| **Depends on** | Phase 09 |

## Scope

### Task 1: Admin Customer Management + Loyalty Admin
- Backend: Customer endpoints (list with filters, detail with orders/loyalty)
- Admin page: `/admin/customers` - list with search, filter by tier
- Admin page: `/admin/customers/[id]` - detail view with orders, loyalty history
- Admin page: `/admin/loyalty` - global loyalty overview, manual point adjustment

### Task 2: Checkout Loyalty Points Redemption
- Backend: Add `pointsToRedeem` field to CreateOrderDto
- Backend: Apply loyalty discount in createOrder flow
- Frontend: Loyalty points section in OrderSummary (show balance, apply points input)
- Frontend: Update checkout submission to include pointsToRedeem

### Task 3: Production Docker + Middleware + Compression
- Dockerfiles for api and web apps
- docker-compose.prod.yml with nginx reverse proxy
- Next.js middleware.ts for admin route protection
- API response compression (gzip)
- CI/CD deploy workflow enhancement
