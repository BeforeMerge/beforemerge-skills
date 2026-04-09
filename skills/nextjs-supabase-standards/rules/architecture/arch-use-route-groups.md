---
title: "Use route groups to organize app sections"
description: "Organize routes using parenthesized layout groups like (auth), (dashboard), (content), (marketing) for separate layouts and clear separation of concerns."
impact: HIGH
impact_description: "Without route groups, the app directory becomes a flat list of routes that share the same layout. This makes it impossible to have different layouts per section and harder to navigate as the app grows."
tags: [architecture, nextjs, app-router, project-structure]
---

## Use route groups to organize app sections

**Impact: HIGH (Without route groups, the app directory becomes a flat list of routes that share the same layout. This makes it impossible to have different layouts per section and harder to navigate as the app grows.)**

## Why This Matters

Route groups in Next.js App Router allow you to:
- Apply **different layouts** per section (auth has minimal layout, dashboard has sidebar)
- **Organize routes** without affecting the URL structure
- Keep the `app/` directory **scalable** as you add more pages

## Good

```
app/
  (auth)/login/page.tsx
  (dashboard)/overview/page.tsx
  (content)/rules/[slug]/page.tsx
  (marketing)/pricing/page.tsx
```

## Bad

```
app/
  login/page.tsx
  overview/page.tsx
  rules/[slug]/page.tsx
  pricing/page.tsx
```

## How to Fix

Create route groups by wrapping directory names in parentheses. The parentheses are stripped from the URL.

```bash
mkdir -p app/(auth) app/(dashboard) app/(content) app/(marketing)
```
