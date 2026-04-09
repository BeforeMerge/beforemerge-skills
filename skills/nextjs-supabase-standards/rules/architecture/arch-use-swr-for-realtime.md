---
title: "Use SWR or React Query for client-side real-time data"
description: "For data that changes frequently (notifications, dashboards), use SWR or React Query instead of manual useEffect + fetch."
impact: MEDIUM
impact_description: "Manual useEffect + useState + fetch patterns require re-implementing caching, revalidation, error handling, and loading states that SWR handles automatically."
tags: [architecture, react, data-fetching, swr]
detection_grep: "useEffect.*setInterval"
---

## Use SWR or React Query for client-side real-time data

**Impact: MEDIUM (Manual useEffect + useState + fetch patterns require re-implementing caching, revalidation, error handling, and loading states that SWR handles automatically.)**

## Why This Matters

SWR and React Query provide:
- **Automatic caching** and deduplication
- **Revalidation** on focus, interval, or mutation
- **Optimistic updates** for instant UI feedback
- **Error retry** with exponential backoff

## Good

```tsx
"use client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function NotificationBell() {
  const { data, error, isLoading } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 30000,
  })
  // ...
}
```

## Bad

```tsx
"use client"
export function NotificationBell() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/notifications")
        .then(r => r.json())
        .then(setData)
        .finally(() => setLoading(false))
    }, 30000)
    return () => clearInterval(interval)
  }, [])
}
```
