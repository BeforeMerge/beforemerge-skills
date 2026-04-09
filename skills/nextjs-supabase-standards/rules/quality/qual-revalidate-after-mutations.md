---
title: "Use revalidatePath after server action mutations"
description: "Call revalidatePath() or revalidateTag() after insert/update/delete operations to refresh cached pages."
impact: HIGH
impact_description: "Next.js caches aggressively. Without explicit revalidation after mutations, the UI shows stale data until the cache expires."
tags: [quality, nextjs, data-fetching, caching]
detection_grep: "revalidatePath"
---

## Use revalidatePath after server action mutations

**Impact: HIGH (Next.js caches aggressively. Without explicit revalidation after mutations, the UI shows stale data until the cache expires.)**

## Why This Matters

Next.js caches server component renders. After a mutation, the cached version is stale.

## Good

```typescript
"use server"
import { revalidatePath } from "next/cache"

export async function updateRule(id: string, data: RuleData) {
  const supabase = createAdminClient()
  await supabase.from("rules").update(data).eq("id", id)
  revalidatePath("/rules")
  revalidatePath(`/rules/${data.slug}`)
}
```

## Bad

```typescript
export async function updateRule(id: string, data: RuleData) {
  await supabase.from("rules").update(data).eq("id", id)
  // No revalidation — UI shows old data!
}
```
