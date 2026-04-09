---
title: "Return the supabaseResponse object unchanged from middleware"
description: "Creating a new NextResponse without copying Supabase cookies breaks session management and causes random logouts."
impact: HIGH
impact_description: "The supabaseResponse object contains updated session cookies. If you create a new response without copying them, the browser and server go out of sync."
tags: [quality, nextjs, supabase, auth, middleware]
detection_grep: "NextResponse.next"
---

## Return the supabaseResponse object unchanged from middleware

**Impact: HIGH (The supabaseResponse object contains updated session cookies. If you create a new response without copying them, the browser and server go out of sync.)**

## Why This Matters

Supabase sets updated session cookies on the response. If you return a different response object, those cookies are lost.

## Good

```typescript
// Always return supabaseResponse
return supabaseResponse

// If you need a custom response:
const myResponse = NextResponse.next({ request })
myResponse.cookies.setAll(supabaseResponse.cookies.getAll())
return myResponse
```

## Bad

```typescript
// Creating new response — session cookies lost!
return NextResponse.next()
```
