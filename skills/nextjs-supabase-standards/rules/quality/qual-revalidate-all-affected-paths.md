---
title: "Revalidate all affected paths after mutations"
description: "A rule update affects /rules, /rules/[slug], the dashboard, and possibly the explore page. Revalidate all of them."
impact: MEDIUM
impact_description: "Revalidating only one path leaves stale data on other pages that display the same content."
tags: [quality, nextjs, caching, server-actions]
detection_grep: "revalidatePath"
---

## Revalidate all affected paths after mutations

**Impact: MEDIUM (Revalidating only one path leaves stale data on other pages that display the same content.)**

## Why This Matters

Content often appears on multiple pages. Revalidating only one leaves others stale.

## Good

```typescript
export async function updateRule(slug: string, data: RuleData) {
  await admin.from("rules").update(data).eq("slug", slug)
  revalidatePath("/rules")
  revalidatePath(`/rules/${slug}`)
  revalidatePath("/explore")
  revalidatePath("/")
}
```
