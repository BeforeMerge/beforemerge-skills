---
title: "Use a lib/ directory for shared utilities"
description: "Centralize shared logic (auth, database clients, formatters) in a lib/ directory to avoid duplication."
impact: LOW
impact_description: "Scattered utility functions lead to duplication and inconsistent implementations across the codebase."
tags: [architecture, nextjs, project-structure]
---

## Use a lib/ directory for shared utilities

**Impact: LOW (Scattered utility functions lead to duplication and inconsistent implementations across the codebase.)**

## Why This Matters

A `lib/` directory creates a clear boundary between:
- **Route code** (`app/`) — page rendering and routing
- **Shared logic** (`lib/`) — auth, database, AI, integrations
- **Components** (`components/`) — reusable UI

## Recommended Structure

```
lib/
  supabase/
    server.ts      # createClient()
    admin.ts       # createAdminClient()
    client.ts      # browser client
  auth.ts          # requireAuth(), session helpers
  content-crud.ts  # generic CRUD factory
  ai/              # AI service layer
```
