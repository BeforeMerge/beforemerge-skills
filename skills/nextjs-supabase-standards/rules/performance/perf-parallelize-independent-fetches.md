---
title: "Parallelize independent data fetches with Promise.all"
description: "Use Promise.all for independent Supabase queries instead of sequential await chains."
impact: HIGH
impact_description: "Sequential awaits create a waterfall -- each query waits for the previous one to complete. Three 200ms queries take 600ms sequentially but only 200ms in parallel."
tags: [performance, nextjs, data-fetching, supabase]
---

## Parallelize independent data fetches with Promise.all

**Impact: HIGH (Sequential awaits create a waterfall -- each query waits for the previous one to complete. Three 200ms queries take 600ms sequentially but only 200ms in parallel.)**

## Why This Matters

Sequential fetches create a waterfall:

```
Query 1: |████████| 200ms
Query 2:          |████████| 200ms
Query 3:                    |████████| 200ms
Total:                                 600ms
```

Parallel fetches overlap:

```
Query 1: |████████| 200ms
Query 2: |████████| 200ms
Query 3: |████████| 200ms
Total:              200ms
```

## Good

```typescript
const [rules, skills, tags] = await Promise.all([
  getRules(),
  getSkills(),
  getTags(),
])
```

## Bad

```typescript
const rules = await getRules()   // waits 200ms
const skills = await getSkills() // waits another 200ms
const tags = await getTags()     // waits another 200ms
```
