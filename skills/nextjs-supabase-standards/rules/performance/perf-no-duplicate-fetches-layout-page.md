---
title: "Never fetch the same data in both layout and page"
description: "Supabase client calls are NOT automatically deduplicated like fetch(). Querying the same data in layout.tsx and page.tsx doubles database load."
impact: MEDIUM
impact_description: "Unlike the native fetch() API which Next.js deduplicates, Supabase client queries run independently. Duplicate queries waste database resources and add latency."
tags: [performance, nextjs, supabase, data-fetching]
---

## Never fetch the same data in both layout and page

**Impact: MEDIUM (Unlike the native fetch() API which Next.js deduplicates, Supabase client queries run independently. Duplicate queries waste database resources and add latency.)**

## Why This Matters

Next.js deduplicates `fetch()` calls during a render pass, but **Supabase client queries are NOT deduplicated**.

## Good

```typescript
// Fetch in layout, pass to page via context or props
// OR fetch only in page, not in layout
```

## Bad

```typescript
// layout.tsx
const { data: user } = await supabase.from("profile").select("*")

// page.tsx (same route)
const { data: user } = await supabase.from("profile").select("*")
// Same query runs TWICE!
```
