---
title: "Never pass server-only data as props to client components"
description: "Props to client components are serialized as JSON and sent to the browser. Don't pass full database records with sensitive fields."
impact: HIGH
impact_description: "Passing a full user object with email, role, internal IDs, or API keys as props exposes them in the client bundle."
tags: [security, nextjs, server-components, secrets]
---

## Never pass server-only data as props to client components

**Impact: HIGH (Passing a full user object with email, role, internal IDs, or API keys as props exposes them in the client bundle.)**

## Why This Matters

Props to `"use client"` components are serialized and sent to the browser. Anyone can see them in DevTools.

## Good

```tsx
// Server component — pick only needed fields
export default async function Page() {
  const user = await getUser()
  return <UserAvatar name={user.display_name} avatarUrl={user.avatar_url} />
}
```

## Bad

```tsx
// Passes entire user object including email, role, internal IDs
export default async function Page() {
  const user = await getUser()
  return <UserAvatar user={user} />  // all fields visible in browser!
}
```
