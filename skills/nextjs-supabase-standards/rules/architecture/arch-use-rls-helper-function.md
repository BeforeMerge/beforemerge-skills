---
title: "Use a helper function for org-scoped RLS checks"
description: "Create an is_org_member(org_id) SECURITY DEFINER function and use it in all org-scoped RLS policies."
impact: HIGH
impact_description: "Repeating the access check logic inline in every policy is error-prone. A centralized helper ensures consistency and is easier to update."
tags: [architecture, supabase, rls, postgresql]
detection_grep: "is_org_member"
---

## Use a helper function for org-scoped RLS checks

**Impact: HIGH (Repeating the access check logic inline in every policy is error-prone. A centralized helper ensures consistency and is easier to update.)**

## Why This Matters

A centralized helper function:
- **Single source of truth** for access logic
- **Easy to update** — change one function, all policies use it
- **SECURITY DEFINER** — runs with elevated privileges to check profile table

## Good

```sql
CREATE FUNCTION is_org_member(org_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profile
    WHERE user_id = auth.uid()
    AND organization_id = org_id
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- All policies use the same helper
CREATE POLICY "org_access" ON scans USING (is_org_member(organization_id));
CREATE POLICY "org_access" ON findings USING (is_org_member(organization_id));
```
