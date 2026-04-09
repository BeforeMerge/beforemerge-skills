# BeforeMerge: Next.js + Supabase Standards

Opinionated best practices for full-stack Next.js 14+ App Router applications with Supabase.

## Install as Agent Skill

```bash
npx skills add BeforeMerge/beforemerge --skill nextjs-supabase-standards
```

## Rules

### 1. Security (17 rules)

| Rule | Impact | Description |
|------|--------|-------------|
| `sec-three-client-types` | CRITICAL | Use three distinct Supabase client types |
| `sec-never-expose-service-role-key` | CRITICAL | Never expose the service_role key to the client |
| `sec-get-user-after-server-client` | CRITICAL | Call auth.getUser() immediately after creating the server client |
| `sec-no-next-public-secrets` | CRITICAL | Store sensitive env vars without NEXT_PUBLIC_ prefix |
| `sec-enable-rls-every-table` | CRITICAL | Enable RLS on every table |
| `sec-deny-by-default-policies` | CRITICAL | Write restrictive RLS policies -- deny by default |
| `sec-scope-mutations-to-org` | CRITICAL | Scope all mutations to the authenticated organization |
| `sec-no-server-imports-in-client` | CRITICAL | Never import server-only code in client components |
| `sec-no-hardcoded-secrets` | CRITICAL | Never hardcode API keys or secrets in source code |
| `sec-use-server-only-package` | HIGH | Mark server modules with import "server-only" |
| `sec-require-auth-in-server-actions` | HIGH | Use requireAuth() as the first call in every server action |
| `sec-anon-key-for-public-pages` | HIGH | Use the anon key for public-facing pages |
| `sec-validate-server-action-inputs` | HIGH | Validate all server action inputs at the boundary |
| `sec-no-admin-for-reads` | HIGH | Never use the admin client for reads in server actions |
| `sec-dont-pass-secrets-as-props` | HIGH | Never pass server-only data as props to client components |
| `sec-validate-sanitize-inputs` | HIGH | Validate and sanitize all user input |
| `sec-test-rls-policies` | HIGH | Test RLS policies explicitly |

### 2. Performance (9 rules)

| Rule | Impact | Description |
|------|--------|-------------|
| `perf-server-components-for-data-fetching` | HIGH | Use server components for data fetching by default |
| `perf-parallelize-independent-fetches` | HIGH | Parallelize independent data fetches with Promise.all |
| `perf-server-components-by-default` | HIGH | Server components by default -- client only when needed |
| `perf-push-client-boundary-low` | HIGH | Push "use client" boundary as low as possible |
| `perf-use-next-image` | HIGH | Use next/image for all images |
| `perf-no-duplicate-fetches-layout-page` | MEDIUM | Never fetch the same data in both layout and page |
| `perf-select-wrapper-auth-uid` | MEDIUM | Use (select auth.uid()) instead of auth.uid() in policies |
| `perf-index-foreign-keys` | MEDIUM | Add indexes on foreign keys and common query filters |
| `perf-dynamic-imports-heavy-components` | MEDIUM | Use dynamic imports for heavy client components |

### 3. Architecture (7 rules)

| Rule | Impact | Description |
|------|--------|-------------|
| `arch-use-route-groups` | HIGH | Use route groups to organize app sections |
| `arch-separate-server-actions` | HIGH | Keep server actions in dedicated files |
| `arch-skip-api-routes-for-supabase` | HIGH | Query Supabase directly in server components |
| `arch-use-rls-helper-function` | HIGH | Use a helper function for org-scoped RLS checks |
| `arch-colocate-page-files` | MEDIUM | Colocate page files with their route segment |
| `arch-use-swr-for-realtime` | MEDIUM | Use SWR or React Query for client-side real-time data |
| `arch-lib-directory-for-shared-utils` | LOW | Use a lib/ directory for shared utilities |

### 4. Quality (20 rules)

| Rule | Impact | Description |
|------|--------|-------------|
| `qual-handle-supabase-errors` | HIGH | Handle Supabase query errors explicitly |
| `qual-revalidate-after-mutations` | HIGH | Use revalidatePath after server action mutations |
| `qual-return-supabase-response-from-middleware` | HIGH | Return the supabaseResponse object unchanged from middleware |
| `qual-query-builder-immutable` | HIGH | Remember the Supabase query builder is immutable |
| `qual-unique-migration-timestamps` | HIGH | Use unique, timestamped migration filenames |
| `qual-use-error-tsx` | HIGH | Use error.tsx for route-level error boundaries |
| `qual-enable-strict-mode` | HIGH | Enable strict mode in tsconfig.json |
| `qual-no-any-type` | HIGH | Never use any -- use unknown for truly unknown types |
| `qual-error-tsx-every-route-group` | HIGH | Add error.tsx to every route group |
| `qual-structured-logging` | HIGH | Use structured logging -- never console.log in production |
| `qual-env-example-in-sync` | HIGH | Keep .env.example in sync with actual environment variables |
| `qual-test-server-actions-isolated` | HIGH | Test server actions in isolation |
| `qual-type-supabase-client` | MEDIUM | Type your Supabase client with generated database types |
| `qual-moddatetime-triggers` | MEDIUM | Use moddatetime triggers for updated_at columns |
| `qual-return-structured-results` | MEDIUM | Return structured results from server actions |
| `qual-revalidate-all-affected-paths` | MEDIUM | Revalidate all affected paths after mutations |
| `qual-use-loading-tsx` | MEDIUM | Use loading.tsx for route-level loading states |
| `qual-not-found-for-dynamic-routes` | MEDIUM | Use notFound() for invalid dynamic route params |
| `qual-kebab-case-files` | MEDIUM | Use kebab-case for file and directory names |
| `qual-atomic-component-organization` | MEDIUM | Organize components into atoms, molecules, organisms |

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the repo root.
