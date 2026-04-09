---
title: "Use three distinct Supabase client types"
description: "Use createClient() for authenticated pages (RLS enforced), createAdminClient() for server-side writes (service_role), and createReadOnlyClient() for public pages (anon key)."
impact: CRITICAL
impact_description: "Using the wrong client type either exposes data (admin client in page) or blocks legitimate access (authenticated client for public content). Each has different security characteristics."
tags: [security, supabase, auth, rls]
detection_grep: "createAdminClient"
---

## Use three distinct Supabase client types

**Impact: CRITICAL (Using the wrong client type either exposes data (admin client in page) or blocks legitimate access (authenticated client for public content). Each has different security characteristics.)**

## Why This Matters

Each client type has different security characteristics:

| Client | RLS | Use Case |
|--------|-----|----------|
| `createClient()` | Enforced | Dashboard pages, user-facing queries |
| `createAdminClient()` | **Bypassed** | Server actions for writes, cron jobs |
| `createReadOnlyClient()` | Enforced (anon) | Public pages (explore, content) |

## Good

```typescript
// Page component — RLS enforced
const supabase = await createClient()
const { data } = await supabase.from("scans").select("*")

// Server action — needs service_role for writes
const admin = createAdminClient()
await admin.from("scans").insert({ ... })
```

## Bad

```typescript
// Page component using admin client — bypasses RLS!
const admin = createAdminClient()
const { data } = await admin.from("scans").select("*") // sees ALL orgs!
```
