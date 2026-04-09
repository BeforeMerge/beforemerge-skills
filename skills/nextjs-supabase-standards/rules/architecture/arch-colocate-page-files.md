---
title: "Colocate page files with their route segment"
description: "Keep page.tsx, layout.tsx, loading.tsx, and error.tsx together in the same route segment directory."
impact: MEDIUM
impact_description: "Scattering related files across directories increases navigation time and makes data dependencies unclear."
tags: [architecture, nextjs, app-router, project-structure]
---

## Colocate page files with their route segment

**Impact: MEDIUM (Scattering related files across directories increases navigation time and makes data dependencies unclear.)**

## Why This Matters

Colocating route files keeps related logic together:
- `page.tsx` — the route component
- `loading.tsx` — loading UI (automatic Suspense boundary)
- `error.tsx` — error boundary
- `layout.tsx` — shared layout

## Good

```
app/(content)/rules/[slug]/
  page.tsx
  loading.tsx
  error.tsx
```

## Bad

```
app/(content)/rules/[slug]/page.tsx
components/rules/RuleLoading.tsx   # loading state far from page
utils/rules/fetchRule.ts           # data fetching far from page
```
