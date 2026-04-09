---
title: "Add error.tsx to every route group"
description: "Each route group ((auth), (dashboard), (content)) should have its own error boundary to contain failures."
impact: HIGH
impact_description: "Without per-group error boundaries, an error in one section crashes the entire app up to the root error boundary."
tags: [quality, nextjs, error-handling, app-router]
detection_grep: "error.tsx"
---

## Add error.tsx to every route group

**Impact: HIGH (Without per-group error boundaries, an error in one section crashes the entire app up to the root error boundary.)**

## Why This Matters

Error boundaries contain failures:
- A bug in settings doesn't crash the dashboard
- A failed API call shows a retry button, not a white screen
- Users stay in the app instead of seeing a full-page error

## Required Files

```
app/(auth)/error.tsx
app/(dashboard)/error.tsx
app/(content)/error.tsx
app/(marketing)/error.tsx
```
