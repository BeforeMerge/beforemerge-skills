---
title: "Keep server actions in dedicated files"
description: "Place server actions in separate *-actions.ts files rather than inline in page components."
impact: HIGH
impact_description: "Inline server actions mix data mutation logic with UI rendering, making them harder to test, reuse, and reason about."
tags: [architecture, nextjs, server-actions]
detection_grep: "\"use server\""
---

## Keep server actions in dedicated files

**Impact: HIGH (Inline server actions mix data mutation logic with UI rendering, making them harder to test, reuse, and reason about.)**

## Why This Matters

Server actions in dedicated files are:
- **Reusable** across multiple pages
- **Testable** in isolation (no component rendering needed)
- **Clear** about what mutations exist

## Good

```typescript
// lib/rule-actions.ts
"use server"

export async function createRule(data: FormData) {
  const { orgId } = await requireAuth()
  // ... create rule scoped to org
}
```

## Bad

```typescript
// app/rules/page.tsx
export default function RulesPage() {
  async function handleCreate() {
    "use server"
    // action logic mixed with UI
  }
  return <form action={handleCreate}>...</form>
}
```
