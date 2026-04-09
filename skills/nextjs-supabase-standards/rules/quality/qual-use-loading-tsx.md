---
title: "Use loading.tsx for route-level loading states"
description: "Add loading.tsx to route segments with slow data fetching. It provides instant visual feedback during navigation."
impact: MEDIUM
impact_description: "Without loading.tsx, navigating to a slow page shows nothing until the server responds -- users think the app is broken."
tags: [quality, nextjs, ux, suspense]
detection_grep: "loading.tsx"
---

## Use loading.tsx for route-level loading states

**Impact: MEDIUM (Without loading.tsx, navigating to a slow page shows nothing until the server responds -- users think the app is broken.)**

## Why This Matters

Next.js wraps `page.tsx` in a Suspense boundary using `loading.tsx` as the fallback. This means:
- Navigation shows instant feedback
- The page shell renders immediately
- Slow data doesn't block the UI

## Good

```tsx
// app/(dashboard)/scans/loading.tsx
export default function Loading() {
  return <ScanListSkeleton />
}
```
