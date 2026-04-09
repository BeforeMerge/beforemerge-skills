---
title: "Validate and sanitize all user input"
description: "Use Zod or similar validation on all API routes and server actions. Never pass raw user input to database queries."
impact: HIGH
impact_description: "Unvalidated input can cause type errors, constraint violations, or injection attacks. Validation at the boundary catches these early."
tags: [security, validation, nextjs, server-actions]
detection_grep: "z.object"
---

## Validate and sanitize all user input

**Impact: HIGH (Unvalidated input can cause type errors, constraint violations, or injection attacks. Validation at the boundary catches these early.)**

## Why This Matters

User input is untrusted. Validate at the boundary:

```typescript
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["member", "admin"]),
})

export async function inviteUser(input: unknown) {
  const data = schema.parse(input)  // Throws on invalid input
  // ... safe to use data
}
```
