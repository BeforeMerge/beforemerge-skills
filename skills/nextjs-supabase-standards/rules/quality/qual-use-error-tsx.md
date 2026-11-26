---
title: "Use error.tsx for route-level error boundaries"
description: "Every route group should have an error.tsx to prevent crashes from propagating to the entire app."
impact: HIGH
impact_description: "Without error.tsx, an unhandled error in any server component crashes the entire route tree up to the nearest error boundary."
tags: [quality, nextjs, error-handling]
detection_grep: "error.tsx"
sources: ["https://nextjs.org/docs/app/getting-started/error-handling", "https://nextjs.org/docs/app/api-reference/file-conventions/error"]
---

## Use error.tsx for route-level error boundaries

**Impact: HIGH (Without error.tsx, an unhandled error in any server component crashes the entire route tree up to the nearest error boundary.)**

## Why This Matters

A bug in `/settings` shouldn't crash `/dashboard`. Each route group needs its own error boundary.

## Good

```tsx
// app/(dashboard)/error.tsx
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

**Note:** `error.tsx` must be a client component (`"use client"`).
