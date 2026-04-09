---
title: "Use dynamic imports for heavy client components"
description: "Use next/dynamic to code-split large client-only components like editors, charts, and maps."
impact: MEDIUM
impact_description: "Large client libraries loaded eagerly increase the initial page bundle size, slowing down first contentful paint."
tags: [performance, nextjs, code-splitting, react]
detection_grep: "next/dynamic"
---

## Use dynamic imports for heavy client components

**Impact: MEDIUM (Large client libraries loaded eagerly increase the initial page bundle size, slowing down first contentful paint.)**

## Why This Matters

`next/dynamic` with `ssr: false` ensures heavy client components are:
- **Code-split** — loaded as a separate chunk
- **Lazy loaded** — only when the component mounts
- **Server-safe** — won't break SSR

## Good

```typescript
import dynamic from "next/dynamic"

const MarkdownEditor = dynamic(
  () => import("./markdown-editor"),
  { loading: () => <Skeleton />, ssr: false }
)
```
