---
title: "Remember the Supabase query builder is immutable"
description: "Supabase's .eq(), .filter(), .order() return new builder objects. Calling them without reassignment does nothing."
impact: HIGH
impact_description: "This is the most common Supabase bug. The filter appears to be applied but is silently discarded, returning unfiltered data."
tags: [quality, supabase, typescript]
detection_grep: ".eq("
---

## Remember the Supabase query builder is immutable

**Impact: HIGH (This is the most common Supabase bug. The filter appears to be applied but is silently discarded, returning unfiltered data.)**

## Why This Matters

The query builder is **immutable** — each method returns a new object.

## Good

```typescript
let query = supabase.from("scans").select("*")
query = query.eq("status", "active")  // reassign!
query = query.order("created_at", { ascending: false })
const { data } = await query
```

## Bad

```typescript
let query = supabase.from("scans").select("*")
query.eq("status", "active")  // DOES NOTHING — return value discarded!
const { data } = await query   // returns ALL scans, not just active
```
