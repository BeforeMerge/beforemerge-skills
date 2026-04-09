---
title: "Server components by default — client only when needed"
description: "Only add \"use client\" for event handlers, useState/useEffect, browser APIs, or client-only libraries. Everything else should be a server component."
impact: HIGH
impact_description: "Every \"use client\" directive adds JavaScript to the browser bundle. Unnecessary client components increase page load time and time-to-interactive."
tags: [performance, nextjs, server-components, react]
detection_grep: "\"use client\""
---

## Server components by default — client only when needed

**Impact: HIGH (Every "use client" directive adds JavaScript to the browser bundle. Unnecessary client components increase page load time and time-to-interactive.)**

## Why This Matters

Server components have **zero JS bundle cost**. Only use `"use client"` when you need:
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect, useRef)
- Browser APIs (window, localStorage)
- Client-only libraries (chart libraries, map libraries)

## Decision Flowchart

```
Does it need interactivity? → Yes → "use client"
                              → No  → Server component (default)
```
