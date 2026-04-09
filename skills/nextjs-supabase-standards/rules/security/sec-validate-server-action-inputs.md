---
title: "Validate all server action inputs at the boundary"
description: "Server actions are public HTTP endpoints. Validate all inputs with Zod or similar before any database operation."
impact: HIGH
impact_description: "Without validation, malformed or malicious input can cause SQL errors, data corruption, or injection attacks."
tags: [security, nextjs, server-actions, validation]
detection_grep: "z.object"
---

## Validate all server action inputs at the boundary

**Impact: HIGH (Without validation, malformed or malicious input can cause SQL errors, data corruption, or injection attacks.)**

## Why This Matters

Server actions can be called by anyone — they're public HTTP endpoints. Never trust the input.

## Good

```typescript
import { z } from "zod"

const CreateRuleSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(["security", "performance", "architecture", "quality"]),
  impact: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
})

export async function createRule(input: unknown) {
  const { orgId } = await requireAuth()
  const data = CreateRuleSchema.parse(input)
  // ... safe to use data
}
```
