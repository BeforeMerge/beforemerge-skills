---
title: "Return structured results from server actions"
description: "Return { success: true, data } or { success: false, error } instead of throwing errors from server actions."
impact: MEDIUM
impact_description: "Thrown errors from server actions surface as generic \"something went wrong\" in the UI. Structured results enable specific error messages."
tags: [quality, nextjs, server-actions, error-handling]
---

## Return structured results from server actions

**Impact: MEDIUM (Thrown errors from server actions surface as generic "something went wrong" in the UI. Structured results enable specific error messages.)**

## Why This Matters

Structured results are:
- **Predictable** — caller always gets the same shape
- **Debuggable** — error messages are specific
- **Type-safe** — TypeScript can narrow the result

## Good

```typescript
export async function createRule(data: RuleInput) {
  try {
    const { orgId } = await requireAuth()
    const result = await admin.from("rules").insert({ ...data, organization_id: orgId })
    return { success: true, data: result.data }
  } catch (error) {
    return { success: false, error: "Failed to create rule" }
  }
}
```
