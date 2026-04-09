---
title: "Use the anon key for public-facing pages"
description: "Public pages (explore, content detail) should use createReadOnlyClient() with the anon key, not the service_role."
impact: HIGH
impact_description: "Using service_role for public page reads bypasses RLS unnecessarily, removing a security layer and potentially exposing private data if a query filter is wrong."
tags: [security, supabase, rls, auth]
detection_grep: "createAdminClient"
---

## Use the anon key for public-facing pages

**Impact: HIGH (Using service_role for public page reads bypasses RLS unnecessarily, removing a security layer and potentially exposing private data if a query filter is wrong.)**

## Why This Matters

RLS is defense-in-depth. Even on public pages, RLS ensures:
- Only `is_published = true` content is visible
- Private org content stays private
- No accidental data exposure from query bugs

## Good

```typescript
// Public explore page
const supabase = createReadOnlyClient()
const { data } = await supabase
  .from("rules")
  .select("*")
  .eq("is_published", true)
  .eq("visibility", "public")
```

## Bad

```typescript
// Using admin client for reads — bypasses RLS!
const admin = createAdminClient()
const { data } = await admin.from("rules").select("*")
```
