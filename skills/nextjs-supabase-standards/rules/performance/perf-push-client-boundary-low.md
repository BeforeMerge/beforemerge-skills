---
title: "Push \"use client\" boundary as low as possible"
description: "Don't add \"use client\" to page or layout files. Extract the interactive part into a small client component."
impact: HIGH
impact_description: "A \"use client\" at the page level makes the entire page client-rendered, losing all server component benefits (zero JS, SEO, streaming)."
tags: [performance, nextjs, server-components, react]
detection_grep: "\"use client\""
---

## Push "use client" boundary as low as possible

**Impact: HIGH (A "use client" at the page level makes the entire page client-rendered, losing all server component benefits (zero JS, SEO, streaming).)**

## Why This Matters

A `"use client"` on a page file makes **everything in that file** client-rendered — including data that could have been fetched on the server.

## Good

```tsx
// components/like-button.tsx — small client component
"use client"
export function LikeButton({ ruleId }: { ruleId: string }) {
  return <button onClick={() => likeRule(ruleId)}>Like</button>
}

// page.tsx — server component (no "use client")
export default async function RulePage({ params }) {
  const rule = await getRule(params.slug)
  return (
    <div>
      <h1>{rule.title}</h1>
      <p>{rule.description}</p>
      <LikeButton ruleId={rule.id} />
    </div>
  )
}
```
