# Phase 17 - Final Polish: Sitemap Endpoints, Admin Error Boundary, OG Image

## Context Links

- [Master Plan](./plan.md)
- [Previous: Production Polish](./phase-16-production-polish.md)

## Overview

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Priority** | High |
| **Status** | Active |
| **Depends on** | Phase 16 |

## Scope

### Task 1: Sitemap Slug Endpoints (CRITICAL)
- sitemap.ts calls /products/slugs, /categories/slugs, /posts/slugs, /pages/slugs
- None of these endpoints exist — sitemap generation silently fails
- Add GET /slugs endpoint to each public controller + service method

### Task 2: Admin Error Boundary + OG Image
- Create admin/error.tsx matching existing error.tsx style
- Create opengraph-image.tsx for dynamic OG image generation (or static fallback)
