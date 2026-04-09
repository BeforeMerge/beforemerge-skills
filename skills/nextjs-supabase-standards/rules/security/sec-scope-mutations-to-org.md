---
title: "Scope all mutations to the authenticated organization"
description: "Every insert/update/delete must include organization_id from requireAuth(). RLS is defense-in-depth, not the only defense."
impact: CRITICAL
impact_description: "Without explicit org scoping, a bug in RLS policies could expose cross-org writes. Defense-in-depth requires both application and database checks."
tags: [security, supabase, server-actions, multi-tenant]
detection_grep: "organization_id"
---

## Scope all mutations to the authenticated organization

**Impact: CRITICAL (Without explicit org scoping, a bug in RLS policies could expose cross-org writes. Defense-in-depth requires both application and database checks.)**

## Why This Matters

RLS is your safety net, but application-level scoping is your primary defense.

## Good

```typescript
export async function createRule(data: FormData) {
  const { orgId } = await requireAuth()
  await admin.from("rules").insert({
    ...data,
    organization_id: orgId,  // Always scope to org
  })
}
```

## Bad

```typescript
export async function createRule(data: FormData) {
  await admin.from("rules").insert(data)
  // Missing org_id — relies entirely on RLS
}
```
