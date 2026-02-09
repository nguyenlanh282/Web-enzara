# Phase 11 - Email, Product Export, Order Print & SEO

## Context Links

- [Master Plan](./plan.md)
- [Previous: Admin, Checkout, Deploy](./phase-10-admin-checkout-deploy.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Priority** | High |
| **Status** | Active |
| **Depends on** | Phase 10 |

## Scope

### Task 1: Password Reset Email + Root SEO Metadata
- Complete the TODO: send password reset email via Resend
- Add passwordReset template to EmailService
- Enhance root layout.tsx with Open Graph, Twitter Cards, icons, PWA manifest
- Add favicon and OG image placeholder

### Task 2: Product CSV Export/Import
- Backend: Export endpoint (CSV download) and Import endpoint (CSV upload/parse)
- Admin: Export button on products page, Import modal with file upload + preview

### Task 3: Order Invoice Print
- Frontend-only print: CSS print stylesheet + print button on admin order detail
- Invoice layout: company info, order details, items table, totals, footer
- Browser window.print() approach (no PDF library needed)
