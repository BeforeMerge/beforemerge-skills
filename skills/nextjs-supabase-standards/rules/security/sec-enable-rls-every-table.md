---
title: "Enable RLS on every table"
description: "Every table must have Row Level Security enabled. Tables without RLS are fully accessible via the anon key."
impact: CRITICAL
impact_description: "A single table without RLS allows any user with the anon key to read, insert, update, and delete all rows. This is the most common Supabase security mistake."
tags: [security, supabase, rls, postgresql]
detection_grep: "ENABLE ROW LEVEL SECURITY"
---

## Enable RLS on every table

**Impact: CRITICAL (A single table without RLS allows any user with the anon key to read, insert, update, and delete all rows. This is the most common Supabase security mistake.)**

## Why This Matters

Supabase exposes your database via a REST API using the anon key (which is public). Without RLS:
- Any browser can query the table directly
- No authentication required
- Full CRUD access to all rows

## Good

```sql
CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id)
);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view scans"
  ON public.scans FOR SELECT
  USING (is_org_member(organization_id));
```

## Bad

```sql
CREATE TABLE public.scans (...);
-- Forgot to enable RLS — table is fully public!
```
