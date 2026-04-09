---
title: "Never use any — use unknown for truly unknown types"
description: "The any type disables all type checking. Use unknown and narrow the type, or use a specific type."
impact: HIGH
impact_description: "any silently turns off TypeScript for that value. Bugs propagate through the codebase without any compile-time warnings."
tags: [quality, typescript]
detection_grep: ":\s*any"
---

## Never use any — use unknown for truly unknown types

**Impact: HIGH (any silently turns off TypeScript for that value. Bugs propagate through the codebase without any compile-time warnings.)**

## Why This Matters

`any` is a type-system escape hatch. It disables ALL checking:

```typescript
const x: any = "hello"
x.foo.bar.baz()  // No error! Crashes at runtime.
```

## Good

```typescript
function processInput(input: unknown) {
  if (typeof input === "string") {
    return input.toUpperCase()  // Safe — narrowed to string
  }
  throw new Error("Expected string")
}
```

## Bad

```typescript
function processInput(input: any) {
  return input.toUpperCase()  // Crashes if input isn't a string
}
```
