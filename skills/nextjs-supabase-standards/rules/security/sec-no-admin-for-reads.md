---
title: "Never use the admin client for reads in server actions"
description: "createAdminClient() bypasses RLS. Use it only for writes that need service_role privileges. For reads, use createClient()."
impact: HIGH
impact_description: "Using the admin client for reads bypasses all access controls. A missing WHERE clause returns all data across all organizations."
tags: [security, supabase, rls, server-actions]
detection_grep: "createAdminClient.*select"
---

## Never use the admin client for reads in server actions

**Impact: HIGH (Using the admin client for reads bypasses all access controls. A missing WHERE clause returns all data across all organizations.)**

## Why This Matters

`createAdminClient()` bypasses RLS — it sees all data. Using it for reads removes your safety net.

## Good

```typescript
export async function getRule(slug: string) {
  const supabase = await createClient()  // RLS enforced
  return supabase.from("rules").select("*").eq("slug", slug).single()
}
```

## Bad

```typescript
export async function getRule(slug: string) {
  const admin = createAdminClient()  // Bypasses RLS!
  return admin.from("rules").select("*").eq("slug", slug).single()
}
```
