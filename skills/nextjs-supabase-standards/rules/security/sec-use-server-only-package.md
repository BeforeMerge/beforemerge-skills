---
title: "Mark server modules with import \"server-only\""
description: "Add import \"server-only\" to any module that uses secrets, database connections, or server-only APIs."
impact: HIGH
impact_description: "Without the server-only marker, Next.js won't prevent accidental imports into client components. The build succeeds but secrets leak."
tags: [security, nextjs, server-components, secrets]
detection_grep: "server-only"
---

## Mark server modules with import "server-only"

**Impact: HIGH (Without the server-only marker, Next.js won't prevent accidental imports into client components. The build succeeds but secrets leak.)**

## Why This Matters

The `server-only` package is a build-time safeguard. When imported, any attempt to bundle this module for the client will throw a build error.

## Good

```typescript
// lib/supabase/admin.ts
import "server-only"

export function createAdminClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
```

## How to Install

```bash
npm install server-only
```

Add `import "server-only"` as the first line of any file that:
- Uses `SUPABASE_SERVICE_ROLE_KEY`
- Accesses database directly
- Reads non-`NEXT_PUBLIC_` env vars
