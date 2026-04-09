---
title: "Use server components for data fetching by default"
description: "Fetch data in async server components instead of client-side useEffect + fetch patterns."
impact: HIGH
impact_description: "Client-side fetching adds loading spinners, waterfalls, exposed API endpoints, and unnecessary JavaScript to the bundle."
tags: [performance, nextjs, server-components, data-fetching]
detection_grep: "useEffect.*fetch"
---

## Use server components for data fetching by default

**Impact: HIGH (Client-side fetching adds loading spinners, waterfalls, exposed API endpoints, and unnecessary JavaScript to the bundle.)**

## Why This Matters

Server Components fetch data at render time with:
- **Zero client JS** — data fetching code never reaches the browser
- **No loading spinners** — page renders with data already present
- **No exposed API** — no public endpoints for attackers to discover

## Good

```tsx
// Server component — async, no "use client"
export default async function RulesPage() {
  const rules = await getRules()
  return <RuleList rules={rules} />
}
```

## Bad

```tsx
"use client"
export default function RulesPage() {
  const [rules, setRules] = useState([])
  useEffect(() => {
    fetch("/api/rules").then(r => r.json()).then(setRules)
  }, [])
  if (!rules.length) return <Spinner />
  return <RuleList rules={rules} />
}
```
