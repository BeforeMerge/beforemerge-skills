---
title: "Test RLS policies explicitly"
description: "Write tests that verify: User A cannot read User B's data. Anon users cannot read private data. RLS bugs are data breaches."
impact: HIGH
impact_description: "RLS policy bugs are silent -- they don't throw errors. Instead, they return data that shouldn't be visible. Only tests catch these."
tags: [security, supabase, rls, testing]
---

## Test RLS policies explicitly

**Impact: HIGH (RLS policy bugs are silent -- they don't throw errors. Instead, they return data that shouldn't be visible. Only tests catch these.)**

## Why This Matters

RLS bugs are the most dangerous kind — they're **silent data breaches**. No error is thrown; you just see data you shouldn't.

## Test Scenarios

1. User A queries → only sees Org A data
2. User A queries with Org B ID → empty result
3. Anon user → only sees published public content
4. User removed from org → immediately loses access

## Example

```typescript
test("user cannot see other org's scans", async () => {
  const clientA = await createAuthenticatedClient(userA)
  const { data } = await clientA.from("scans").select("*")
  expect(data.every(s => s.organization_id === orgA.id)).toBe(true)
})
```
