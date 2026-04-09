---
title: "Never expose the service_role key to the client"
description: "The SUPABASE_SERVICE_ROLE_KEY must never be in a NEXT_PUBLIC_ env var or imported in \"use client\" files."
impact: CRITICAL
impact_description: "The service_role key bypasses ALL Row Level Security policies. If leaked to the browser, any user can read, modify, or delete ALL data in your database."
tags: [security, supabase, secrets, env]
detection_grep: "NEXT_PUBLIC_SUPABASE_SERVICE"
---

## Never expose the service_role key to the client

**Impact: CRITICAL (The service_role key bypasses ALL Row Level Security policies. If leaked to the browser, any user can read, modify, or delete ALL data in your database.)**

## Why This Matters

The service_role key is a **superadmin key** that bypasses all RLS policies. In the browser:
- Any user can query any table
- Any user can modify any row
- Your entire database is exposed

## Good

```env
# .env.local — server-only
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Bad

```env
# NEVER DO THIS
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Detection

Search for `NEXT_PUBLIC_SUPABASE_SERVICE` in all env files and code.
