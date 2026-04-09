---
title: "Call auth.getUser() immediately after creating the server client in middleware"
description: "Per Supabase docs: do not run code between createServerClient and supabase.auth.getUser(). A simple mistake could cause random logouts."
impact: CRITICAL
impact_description: "Running code between client creation and getUser() can corrupt the session cookie state, causing users to be randomly logged out with no clear cause."
tags: [security, supabase, auth, middleware]
detection_grep: "createServerClient"
---

## Call auth.getUser() immediately after creating the server client in middleware

**Impact: CRITICAL (Running code between client creation and getUser() can corrupt the session cookie state, causing users to be randomly logged out with no clear cause.)**

## Why This Matters

This is a documented Supabase requirement. The auth session must be refreshed immediately after client creation in middleware.

## Good

```typescript
// middleware.ts
const supabase = createServerClient(url, key, { cookies: { ... } })

// IMPORTANT: Call getUser() IMMEDIATELY
const { data: { user } } = await supabase.auth.getUser()

if (!user && !isPublicRoute(request.nextUrl.pathname)) {
  return NextResponse.redirect(new URL("/login", request.url))
}
```

## Bad

```typescript
const supabase = createServerClient(url, key, { cookies: { ... } })

// DON'T put code here — causes random logouts!
const someData = await doSomething()

const { data: { user } } = await supabase.auth.getUser()
```
