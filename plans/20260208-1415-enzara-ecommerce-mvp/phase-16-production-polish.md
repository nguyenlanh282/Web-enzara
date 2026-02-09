# Phase 16 - Production Polish: Route Fix, Error Boundaries, Health Check

## Context Links

- [Master Plan](./plan.md)
- [Previous: Production Readiness](./phase-15-production-ready.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Priority** | Critical |
| **Status** | Active |
| **Depends on** | Phase 15 |

## Scope

### Task 1: Fix Controller Route Prefixes (CRITICAL)
- 18 controllers have `@Controller('api/...')` which creates double `/api/api/...` routes
- Since `main.ts` sets `app.setGlobalPrefix("api")`, all controller paths should NOT include `api/`
- Remove `api/` prefix from all affected controllers

### Task 2: Error Boundaries + Loading States
- Create `global-error.tsx` at app root
- Create `loading.tsx` for admin layout (skeleton loading)
- Add health check endpoint (GET /api/health with DB ping)

### Task 3: Console.log Cleanup + .env.example
- Remove/conditionalize console.log statements in production code
- Create .env.example files for apps/api and apps/web
