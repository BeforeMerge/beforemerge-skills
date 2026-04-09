---
title: "Type your Supabase client with generated database types"
description: "Use supabase gen types typescript to generate types from your schema, then pass them as a generic: createClient<Database>()."
impact: MEDIUM
impact_description: "Without generated types, the Supabase client returns `any` for all queries. Column name typos and type mismatches are only caught at runtime."
tags: [quality, supabase, typescript]
detection_grep: "Database"
---

## Type your Supabase client with generated database types

**Impact: MEDIUM (Without generated types, the Supabase client returns `any` for all queries. Column name typos and type mismatches are only caught at runtime.)**

## Why This Matters

Generated types give you:
- **Autocomplete** for table and column names
- **Type errors** for wrong column types
- **Compile-time safety** instead of runtime errors

## How to Generate

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > database.types.ts
```

## Good

```typescript
import { Database } from "./database.types"

const supabase = createServerClient<Database>(url, key, { ... })
const { data } = await supabase.from("rules").select("title, slug")
// data is typed: { title: string; slug: string }[]
```
