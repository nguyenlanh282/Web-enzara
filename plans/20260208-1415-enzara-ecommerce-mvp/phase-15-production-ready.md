# Phase 15 - Production Readiness: Admin Profile, Static Files, Error Handling & Seed

## Context Links

- [Master Plan](./plan.md)
- [Previous: Admin Notifications, Navigation, Auth](./phase-14-admin-notif-nav-auth.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Priority** | High |
| **Status** | Active |
| **Depends on** | Phase 14 |

## Scope

### Task 1: Admin Profile Page + Static File Serving
- Frontend: `/admin/profile` page — view & edit fullName, phone, change password
- Uses existing `GET /api/auth/profile`, `PUT /api/auth/profile`, `POST /api/auth/change-password`
- Backend: Add ServeStaticModule to serve `/uploads` directory for media files
- Install @nestjs/serve-static if needed

### Task 2: Global Exception Filter + Request Logging Middleware
- Create `HttpExceptionFilter` in `apps/api/src/common/filters/http-exception.filter.ts`
- Consistent JSON error response format: `{ statusCode, message, error, timestamp, path }`
- Create `LoggerMiddleware` in `apps/api/src/common/middleware/logger.middleware.ts`
- Log: method, url, statusCode, responseTime
- Register filter globally in main.ts, middleware in AppModule

### Task 3: Seed Script Enhancement
- Add 5 sample Enzara products with variants (matching real product lines)
- Add 2 sample blog posts (PUBLISHED)
- Add 3 policy pages (chinh-sach-bao-mat, chinh-sach-doi-tra, dieu-khoan-su-dung)
- Add header menu and footer menu
- Add 1 sample hero banner
- All use upsert to be idempotent
