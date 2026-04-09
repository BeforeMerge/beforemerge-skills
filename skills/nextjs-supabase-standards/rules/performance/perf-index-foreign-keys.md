---
title: "Add indexes on foreign keys and common query filters"
description: "PostgreSQL does NOT auto-index foreign keys. Queries filtering by organization_id or repository_id will full-table-scan without explicit indexes."
impact: MEDIUM
impact_description: "Missing indexes on frequently-queried foreign keys cause slow queries that degrade exponentially as table size grows."
tags: [performance, supabase, postgresql]
detection_grep: "REFERENCES"
---

## Add indexes on foreign keys and common query filters

**Impact: MEDIUM (Missing indexes on frequently-queried foreign keys cause slow queries that degrade exponentially as table size grows.)**

## Why This Matters

PostgreSQL creates indexes on PRIMARY KEYs and UNIQUE columns automatically, but **NOT on foreign keys**.

## Good

```sql
CREATE TABLE findings (
  id uuid PRIMARY KEY,
  scan_id uuid REFERENCES scans(id),
  rule_id uuid REFERENCES rules(id)
);

CREATE INDEX idx_finding_scan ON findings(scan_id);
CREATE INDEX idx_finding_rule ON findings(rule_id);
```

## Bad

```sql
CREATE TABLE findings (
  scan_id uuid REFERENCES scans(id),  -- No index!
  rule_id uuid REFERENCES rules(id)   -- No index!
);
```
