---
title: "Use (select auth.uid()) instead of auth.uid() in policies"
description: "Wrapping auth.uid() in (select ...) ensures it's evaluated once per query instead of once per row."
impact: MEDIUM
impact_description: "Without the select wrapper, auth.uid() may be re-evaluated for every row in the table, degrading performance on large tables."
tags: [performance, supabase, rls, postgresql]
detection_grep: "auth.uid()"
---

## Use (select auth.uid()) instead of auth.uid() in policies

**Impact: MEDIUM (Without the select wrapper, auth.uid() may be re-evaluated for every row in the table, degrading performance on large tables.)**

## Why This Matters

PostgreSQL may evaluate `auth.uid()` per-row without the subquery wrapper. On a table with millions of rows, this adds overhead.

## Good

```sql
CREATE POLICY "own_data" ON profiles
  FOR SELECT USING (id = (SELECT auth.uid()));
```

## Bad

```sql
CREATE POLICY "own_data" ON profiles
  FOR SELECT USING (id = auth.uid());  -- evaluated per row
```
