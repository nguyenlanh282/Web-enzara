# Testing Infrastructure - Implementation Plan

**Date:** 2026-02-11
**Status:** Pending
**Monorepo:** Turborepo + pnpm (apps/api, apps/web, packages/utils)
**Current state:** Zero tests, zero test configs across entire codebase.

## Summary

Stand up Vitest + Playwright testing infrastructure across the Enzara e-commerce monorepo. Six phases move from config scaffolding through unit, integration, component, and E2E tests. Each phase is independently mergeable and adds immediate regression coverage.

## Phases

| # | Phase | File | Status | Priority |
|---|-------|------|--------|----------|
| 1 | Framework Setup & Config | [phase-01.md](./phase-01.md) | pending | P0 - blocker |
| 2 | API Unit Tests (Critical Business Logic) | [phase-02.md](./phase-02.md) | pending | P0 |
| 3 | API Integration Tests (HTTP/Supertest) | [phase-03.md](./phase-03.md) | pending | P1 |
| 4 | Web Unit Tests (Stores, Utils, API Client) | [phase-04.md](./phase-04.md) | pending | P1 |
| 5 | Web Component Tests (RTL) | [phase-05.md](./phase-05.md) | pending | P2 |
| 6 | E2E Tests (Playwright) | [phase-06.md](./phase-06.md) | pending | P2 |

## Dependency Graph

```
Phase 1 (config)
  |-- Phase 2 (API unit)
  |     \-- Phase 3 (API integration)
  |-- Phase 4 (Web unit)
  |     \-- Phase 5 (Web component)
  \-- Phase 6 (E2E) -- depends on Phase 1 only
```

## Research

- [Researcher 01](./research/researcher-01-report.md) - Vitest + NestJS + Prisma + Redis + Supertest + SePay
- [Researcher 02](./research/researcher-02-report.md) - Vitest + Next.js 15 + RTL + Zustand + Playwright + Turborepo
- [Scout 01](./scout/scout-01-report.md) - Full codebase inventory

## Tech Stack Decisions

| Concern | Tool | Version |
|---------|------|---------|
| Test runner (all) | Vitest | ^2.0.0 |
| NestJS transform | unplugin-swc + @swc/core | latest |
| Prisma mock | vitest-mock-extended | ^2.0.0 |
| Redis mock | ioredis-mock | ^8.0.0 |
| HTTP integration | supertest | ^7.0.0 |
| React component | @testing-library/react + jest-dom | ^16.0.0 / latest |
| React transform | @vitejs/plugin-react | ^4.3.0 |
| Browser DOM | jsdom | latest |
| E2E | @playwright/test | latest |

## Estimated Effort

- Phase 1: 2-3 hours (config files, deps, CI)
- Phase 2: 6-8 hours (6 critical services, ~60 test cases)
- Phase 3: 4-5 hours (4 endpoint groups, ~20 test cases)
- Phase 4: 3-4 hours (stores, utils, API client, ~30 test cases)
- Phase 5: 4-5 hours (6 components, ~25 test cases)
- Phase 6: 4-5 hours (6 E2E flows, ~15 scenarios)

**Total: ~23-30 hours**

## Unresolved Questions

1. Does `next-intl` use `messages/` or a custom i18n config path? -- Resolved: `src/messages/{vi,en}.json`
2. Should coverage thresholds be enforced from day one or added gradually?
3. Is there a staging environment for Playwright E2E, or should it run against `localhost`?
