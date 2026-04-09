---
title: "Enable strict mode in tsconfig.json"
description: "Set \"strict\": true in tsconfig.json to catch null errors, implicit any, and type coercion bugs at compile time."
impact: HIGH
impact_description: "Without strict mode, TypeScript allows implicit any types, unchecked null access, and other patterns that cause runtime crashes."
tags: [quality, typescript, nextjs]
detection_grep: "\"strict\""
---

## Enable strict mode in tsconfig.json

**Impact: HIGH (Without strict mode, TypeScript allows implicit any types, unchecked null access, and other patterns that cause runtime crashes.)**

## Why This Matters

Strict mode enables:
- `strictNullChecks` — catch null/undefined access at compile time
- `noImplicitAny` — no silent any types
- `strictFunctionTypes` — correct function type checking

## Good

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```
