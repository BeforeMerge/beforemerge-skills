---
title: "Use kebab-case for file and directory names"
description: "Name files and directories in kebab-case (lowercase with hyphens) to avoid cross-platform case sensitivity issues."
impact: MEDIUM
impact_description: "Git on macOS is case-insensitive by default. A file renamed from MyComponent.tsx to myComponent.tsx won't be tracked as a change, causing bugs on Linux CI."
tags: [quality, nextjs, project-structure, conventions]
detection_grep: "[A-Z].*\.tsx?$"
---

## Use kebab-case for file and directory names

**Impact: MEDIUM (Git on macOS is case-insensitive by default. A file renamed from MyComponent.tsx to myComponent.tsx won't be tracked as a change, causing bugs on Linux CI.)**

## Why This Matters

Case sensitivity differs between operating systems:
- **macOS/Windows**: case-insensitive (MyFile.tsx = myfile.tsx)
- **Linux**: case-sensitive (MyFile.tsx ≠ myfile.tsx)

Using kebab-case eliminates this entire class of bugs.

## Good

```
lib/rule-actions.ts
components/molecules/fancy-select.tsx
app/(content)/rules/[slug]/page.tsx
```

## Bad

```
lib/RuleActions.ts
components/molecules/FancySelect.tsx
```

**Exception:** React component files can use PascalCase if your team prefers it, but be consistent.
