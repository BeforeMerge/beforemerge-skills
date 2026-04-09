---
title: "Handle Supabase query errors explicitly"
description: "Always check the error field from Supabase queries. The client returns { data, error } and never throws."
impact: HIGH
impact_description: "Ignoring the error field means your page silently renders with null data, showing blank content or crashing on null access."
tags: [quality, supabase, error-handling]
detection_grep: ".from("
---

## Handle Supabase query errors explicitly

**Impact: HIGH (Ignoring the error field means your page silently renders with null data, showing blank content or crashing on null access.)**

## Why This Matters

Supabase client methods return `{ data, error }` — they **never throw**. If you destructure only `data`, errors are silently swallowed.

## Good

```typescript
const { data, error } = await supabase
  .from("rules")
  .select("*")

if (error) {
  log.error({ error }, "Failed to fetch rules")
  throw new Error(`Failed to fetch rules: ${error.message}`)
}

return data
```

## Bad

```typescript
const { data } = await supabase.from("rules").select("*")
return data  // could be null if query failed!
```
