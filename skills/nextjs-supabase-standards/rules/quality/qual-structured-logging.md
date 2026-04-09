---
title: "Use structured logging — never console.log in production"
description: "Use a structured logger like pino instead of console.log. Structured logs have timestamps, levels, and are filterable."
impact: HIGH
impact_description: "console.log can leak secrets in stack traces, is impossible to filter in production, and lacks log levels for severity-based alerting."
tags: [quality, logging, security, observability]
detection_grep: "console\.log"
---

## Use structured logging — never console.log in production

**Impact: HIGH (console.log can leak secrets in stack traces, is impossible to filter in production, and lacks log levels for severity-based alerting.)**

## Why This Matters

`console.log` in production:
- **Leaks secrets** in error stack traces
- **Can't be filtered** by log level
- **No timestamps** for debugging timing issues
- **No structured data** for log aggregation

## Good

```typescript
import { log } from "./logger"

log.info({ scanId, tool: "semgrep" }, "tool_start")
log.error({ scanId, error: msg }, "scan_failed")
```

## Bad

```typescript
console.log("starting scan...")
console.error(JSON.stringify({ event: "error", details: err }))
```
