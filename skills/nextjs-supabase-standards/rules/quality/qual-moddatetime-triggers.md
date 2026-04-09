---
title: "Use moddatetime triggers for updated_at columns"
description: "Use database triggers to auto-update updated_at instead of setting it in application code."
impact: MEDIUM
impact_description: "Manually setting updated_at in application code is error-prone -- any code path that updates the row but forgets to set updated_at leaves stale timestamps."
tags: [quality, supabase, postgresql, migrations]
detection_grep: "moddatetime"
---

## Use moddatetime triggers for updated_at columns

**Impact: MEDIUM (Manually setting updated_at in application code is error-prone -- any code path that updates the row but forgets to set updated_at leaves stale timestamps.)**

## Why This Matters

Database triggers guarantee `updated_at` is always current, regardless of which code path updates the row.

## Good

```sql
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON rules
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);
```

## Bad

```typescript
// Some code paths forget to update the timestamp
await supabase.from("rules").update({
  title: newTitle,
  // forgot updated_at!
})
```
