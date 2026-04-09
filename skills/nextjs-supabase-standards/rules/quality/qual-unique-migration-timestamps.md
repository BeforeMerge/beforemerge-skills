---
title: "Use unique, timestamped migration filenames"
description: "Migration files must have unique timestamps: YYYYMMDDHHMMSS_description.sql. Supabase errors on duplicate versions."
impact: HIGH
impact_description: "Duplicate migration timestamps cause schema_migrations conflicts, breaking deployment and requiring manual database intervention."
tags: [quality, supabase, postgresql, migrations]
---

## Use unique, timestamped migration filenames

**Impact: HIGH (Duplicate migration timestamps cause schema_migrations conflicts, breaking deployment and requiring manual database intervention.)**

## Why This Matters

Supabase tracks applied migrations in `schema_migrations`. Duplicate timestamps cause:
- Failed `supabase db push`
- Manual cleanup required
- Deployment blocked

## Good

```
20260409120000_create_audit_rules.sql
20260409120001_create_standards_scores.sql
20260409120002_create_convention_rules.sql
```

## Bad

```
20260409120000_create_audit_rules.sql
20260409120000_create_standards_scores.sql  # DUPLICATE timestamp!
```
