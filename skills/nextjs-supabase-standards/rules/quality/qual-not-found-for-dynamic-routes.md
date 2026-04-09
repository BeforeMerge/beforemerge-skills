---
title: "Use notFound() for invalid dynamic route params"
description: "When a dynamic route param doesn't match any record, call notFound() from next/navigation to show the 404 page."
impact: MEDIUM
impact_description: "Without notFound(), invalid slugs either crash with a null access error or silently render an empty page."
tags: [quality, nextjs, error-handling, app-router]
detection_grep: "notFound"
---

## Use notFound() for invalid dynamic route params

**Impact: MEDIUM (Without notFound(), invalid slugs either crash with a null access error or silently render an empty page.)**

## Why This Matters

`notFound()` triggers the nearest `not-found.tsx` page, giving users a clear 404 instead of a crash.

## Good

```typescript
import { notFound } from "next/navigation"

export default async function RulePage({ params }) {
  const rule = await getRule(params.slug)
  if (!rule) notFound()
  return <RuleDetail rule={rule} />
}
```
