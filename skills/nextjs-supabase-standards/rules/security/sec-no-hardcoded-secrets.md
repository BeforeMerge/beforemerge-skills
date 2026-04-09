---
title: "Never hardcode API keys or secrets in source code"
description: "Always use environment variables for API keys, database credentials, and other secrets."
impact: CRITICAL
impact_description: "Hardcoded secrets end up in git history, CI logs, and client bundles. They cannot be rotated without a code change."
tags: [security, secrets, env]
detection_grep: "(api_key|secret|password|token)\s*=\s*['\"]"
---

## Never hardcode API keys or secrets in source code

**Impact: CRITICAL (Hardcoded secrets end up in git history, CI logs, and client bundles. They cannot be rotated without a code change.)**

## Why This Matters

Hardcoded secrets are:
- **In git history forever** — even after removal
- **Visible in CI logs** — build output may print them
- **In client bundles** — if in a "use client" file
- **Hard to rotate** — requires code change + deployment

## Good

```typescript
const apiKey = process.env.ANTHROPIC_API_KEY
```

## Bad

```typescript
const apiKey = "sk-ant-api03-..."  // NEVER
```
