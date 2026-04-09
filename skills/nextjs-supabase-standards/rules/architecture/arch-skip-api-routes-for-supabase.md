---
title: "Query Supabase directly in server components — skip API routes"
description: "Server components can query Supabase directly. Don't create API route middlemen just to proxy Supabase queries."
impact: HIGH
impact_description: "Unnecessary API routes add latency, code, and maintenance burden without security benefit when server components already run on the server."
tags: [architecture, nextjs, supabase, data-fetching]
---

## Query Supabase directly in server components — skip API routes

**Impact: HIGH (Unnecessary API routes add latency, code, and maintenance burden without security benefit when server components already run on the server.)**

## Why This Matters

Server components run on the server — they can query Supabase directly. Creating an API route that just calls Supabase and returns the result is unnecessary indirection.

## Good

```typescript
// app/(content)/rules/page.tsx (server component)
const supabase = await createClient()
const { data: rules } = await supabase.from("rules").select("*")
```

## Bad

```typescript
// app/api/rules/route.ts — unnecessary middleman
export async function GET() {
  const { data } = await supabase.from("rules").select("*")
  return Response.json(data)
}

// page.tsx — calls the unnecessary API route
const rules = await fetch("/api/rules").then(r => r.json())
```

**Exception:** API routes ARE needed for: webhooks, external consumers, OAuth callbacks, cron jobs.
