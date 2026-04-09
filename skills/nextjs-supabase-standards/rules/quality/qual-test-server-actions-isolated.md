---
title: "Test server actions in isolation"
description: "Server actions are async functions. Test them directly without rendering UI. Mock requireAuth() and the Supabase client."
impact: HIGH
impact_description: "Testing server actions through UI rendering is slow, flaky, and doesn't isolate the mutation logic from rendering concerns."
tags: [quality, nextjs, server-actions, testing]
---

## Test server actions in isolation

**Impact: HIGH (Testing server actions through UI rendering is slow, flaky, and doesn't isolate the mutation logic from rendering concerns.)**

## Why This Matters

Server actions are pure async functions — test them like any other function.

## Good

```typescript
test("createRule requires auth", async () => {
  vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))
  await expect(createRule(mockData)).rejects.toThrow("Unauthorized")
})

test("createRule inserts with org scope", async () => {
  vi.mocked(requireAuth).mockResolvedValue({ orgId: "org-1", userId: "user-1" })
  await createRule(mockData)
  expect(mockInsert).toHaveBeenCalledWith(
    expect.objectContaining({ organization_id: "org-1" })
  )
})
```
