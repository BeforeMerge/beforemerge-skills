---
title: "Use requireAuth() as the first call in every authenticated server action"
description: "Every server action that modifies data must call requireAuth() first to validate the user session and get orgId."
impact: HIGH
impact_description: "Server actions are public HTTP endpoints. Without auth checks, any unauthenticated request can trigger mutations."
tags: [security, nextjs, server-actions, auth]
detection_grep: "requireAuth"
---

## Use requireAuth() as the first call in every authenticated server action

**Impact: HIGH (Server actions are public HTTP endpoints. Without auth checks, any unauthenticated request can trigger mutations.)**

## Why This Matters

Server actions are exposed as HTTP endpoints. Anyone can call them without authentication unless you explicitly check.

## Good

```typescript
"use server"

export async function createRule(data: FormData) {
  const { orgId, userId } = await requireAuth()
  const admin = createAdminClient()
  await admin.from("rules").insert({
    ...data,
    organization_id: orgId,
    created_by: userId,
  })
}
```

## Bad

```typescript
"use server"

export async function createRule(data: FormData) {
  const admin = createAdminClient()
  await admin.from("rules").insert(data) // No auth check!
}
```
