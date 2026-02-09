# Phase 12 - Checkout Voucher, Recently Viewed & Email Verification

## Context Links

- [Master Plan](./plan.md)
- [Previous: Email, Export, Print, SEO](./phase-11-email-export-print-seo.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Priority** | High |
| **Status** | Active |
| **Depends on** | Phase 11 |

## Scope

### Task 1: Checkout Voucher Input + Recently Viewed Products
- Frontend: VoucherInput component in checkout page (input field, apply button, remove)
- Uses existing cartStore.applyVoucher / removeVoucher + /api/vouchers/validate endpoint
- Recently viewed: Zustand + localStorage store (max 10 products, track on product detail view)
- RecentlyViewed horizontal carousel on product detail page (below reviews)

### Task 2: Email Verification + Welcome Email + Registration Loyalty Points
- Backend: Verification token generation (crypto.randomBytes), store in Setting table
- Backend: Send verification email on register (via EmailService)
- Backend: `POST /auth/verify-email` endpoint (validate token, set emailVerified=true)
- Backend: `POST /auth/resend-verification` endpoint (rate-limited to 1 per 5 minutes)
- Backend: Welcome email HTML template in EmailService
- Backend: Award +100 loyalty points on registration (LoyaltyService.awardRegistrationPoints)
- Frontend: Email verification prompt banner in account layout (if !emailVerified)
- Frontend: `/auth/verify-email` success page

### Task 3: Order Confirmation Email Enhancement
- Backend: Send order confirmation email automatically when order is created
- Backend: Send payment success email when SePay payment confirmed
- Email templates already exist in EmailService - wire them into order/payment flows
