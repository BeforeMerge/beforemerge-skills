---
name: beforemerge-nextjs-supabase-standards
description: Opinionated best practices for full-stack Next.js 14+ App Router applications with Supabase. Covers project structure, data fetching, auth, RLS, server actions, components, TypeScript, performance, error handling, security, and testing. Use this skill when building, reviewing, or auditing Next.js + Supabase applications. Triggers on tasks involving Supabase client usage, RLS policies, server actions, middleware auth, migration patterns, or component architecture decisions.
license: MIT
metadata:
  author: beforemerge
  version: "1.0.0"
  website: https://beforemerge.dev
---

# BeforeMerge: Next.js + Supabase Standards

A curated collection of 53 opinionated, production-proven best practices for building full-stack applications with Next.js (App Router) and Supabase.

## When to Apply

Reference these rules when:
- Building new features in a Next.js + Supabase application
- Reviewing pull requests that touch Supabase queries, RLS policies, or server actions
- Setting up auth middleware or session management
- Writing database migrations or RLS policies
- Auditing security of Supabase client usage
- Optimizing performance of server/client component boundaries

## Rule Categories by Priority

| Priority | Category | Count | Prefix | Focus |
|----------|----------|-------|--------|-------|
| 1 | Security | 17 | `sec-` | Client types, RLS, secrets, auth, input validation |
| 2 | Performance | 9 | `perf-` | Server components, parallel fetches, images, indexes |
| 3 | Architecture | 7 | `arch-` | Route groups, server actions, project structure |
| 4 | Quality | 20 | `qual-` | Error handling, TypeScript, logging, migrations |

## How to Use

Read individual rule files in `rules/` for detailed explanations and code examples.

Each rule contains:
- Brief explanation of why it matters
- Good and bad code examples
- Impact rating (CRITICAL, HIGH, MEDIUM, LOW)
- Detection hints for automated enforcement
