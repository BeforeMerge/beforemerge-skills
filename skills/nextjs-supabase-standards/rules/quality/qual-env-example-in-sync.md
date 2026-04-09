---
title: "Keep .env.example in sync with actual environment variables"
description: "Maintain a .env.example file with all required variables (no values). New developers can't set up the project without it."
impact: HIGH
impact_description: "A missing variable in .env.example means new team members waste time figuring out what environment variables are needed."
tags: [quality, env, developer-experience]
detection_grep: "process.env"
---

## Keep .env.example in sync with actual environment variables

**Impact: HIGH (A missing variable in .env.example means new team members waste time figuring out what environment variables are needed.)**

## Why This Matters

`.env.example` is the contract for required environment variables.

## Good

```env
# .env.example — committed to git
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
ANTHROPIC_API_KEY=
```

## Audit

Regularly grep for `process.env.` and compare against `.env.example`.
