# BeforeMerge: nextjs-supabase-standards

Opinionated best practices for full-stack Next.js 14+ App Router applications with Supabase. Covers project structure, data fetching, auth, RLS, server actions, components, TypeScript, performance, error handling, security, and testing. Each rule includes why it matters, good and bad code examples, impact ratings, and detection hints for automated enforcement.

## Table of Contents

### 1. Security Anti-Patterns (CRITICAL)
- 1. Use the anon key for public-facing pages — HIGH
- 2. Write restrictive RLS policies — deny by default — CRITICAL
- 3. Never pass server-only data as props to client components — HIGH
- 4. Enable RLS on every table — CRITICAL
- 5. Call auth.getUser() immediately after creating the server client in middleware — CRITICAL
- 6. Never expose the service_role key to the client — CRITICAL
- 7. Never use the admin client for reads in server actions — HIGH
- 8. Never hardcode API keys or secrets in source code — CRITICAL
- 9. Store sensitive env vars without NEXT_PUBLIC_ prefix — CRITICAL
- 10. Never import server-only code in client components — CRITICAL
- 11. Use requireAuth() as the first call in every authenticated server action — HIGH
- 12. Scope all mutations to the authenticated organization — CRITICAL
- 13. Test RLS policies explicitly — HIGH
- 14. Use three distinct Supabase client types — CRITICAL
- 15. Mark server modules with import \"server-only\" — HIGH
- 16. Validate and sanitize all user input — HIGH
- 17. Validate all server action inputs at the boundary — HIGH
### 2. Performance Patterns (HIGH)
- 18. Use dynamic imports for heavy client components — MEDIUM
- 19. Add indexes on foreign keys and common query filters — MEDIUM
- 20. Never fetch the same data in both layout and page — MEDIUM
- 21. Parallelize independent data fetches with Promise.all — HIGH
- 22. Push \"use client\" boundary as low as possible — HIGH
- 23. Use (select auth.uid()) instead of auth.uid() in policies — MEDIUM
- 24. Server components by default — client only when needed — HIGH
- 25. Use server components for data fetching by default — HIGH
- 26. Use next/image for all images — HIGH
### 3. Architecture Patterns (MEDIUM)
- 27. Colocate page files with their route segment — MEDIUM
- 28. Use a lib/ directory for shared utilities — LOW
- 29. Keep server actions in dedicated files — HIGH
- 30. Query Supabase directly in server components — skip API routes — HIGH
- 31. Use a helper function for org-scoped RLS checks — HIGH
- 32. Use route groups to organize app sections — HIGH
- 33. Use SWR or React Query for client-side real-time data — MEDIUM
### 4. Code Quality (LOW-MEDIUM)
- 34. Organize components into atoms, molecules, organisms — MEDIUM
- 35. Enable strict mode in tsconfig.json — HIGH
- 36. Keep .env.example in sync with actual environment variables — HIGH
- 37. Add error.tsx to every route group — HIGH
- 38. Handle Supabase query errors explicitly — HIGH
- 39. Use kebab-case for file and directory names — MEDIUM
- 40. Use moddatetime triggers for updated_at columns — MEDIUM
- 41. Never use any — use unknown for truly unknown types — HIGH
- 42. Use notFound() for invalid dynamic route params — MEDIUM
- 43. Remember the Supabase query builder is immutable — HIGH
- 44. Return structured results from server actions — MEDIUM
- 45. Return the supabaseResponse object unchanged from middleware — HIGH
- 46. Use revalidatePath after server action mutations — HIGH
- 47. Revalidate all affected paths after mutations — MEDIUM
- 48. Use structured logging — never console.log in production — HIGH
- 49. Test server actions in isolation — HIGH
- 50. Type your Supabase client with generated database types — MEDIUM
- 51. Use unique, timestamped migration filenames — HIGH
- 52. Use error.tsx for route-level error boundaries — HIGH
- 53. Use loading.tsx for route-level loading states — MEDIUM

---

## Rules

## Use the anon key for public-facing pages

**Impact: HIGH (Using service_role for public page reads bypasses RLS unnecessarily, removing a security layer and potentially exposing private data if a query filter is wrong.)**

## Why This Matters

RLS is defense-in-depth. Even on public pages, RLS ensures:
- Only `is_published = true` content is visible
- Private org content stays private
- No accidental data exposure from query bugs

## Good

```typescript
// Public explore page
const supabase = createReadOnlyClient()
const { data } = await supabase
  .from("rules")
  .select("*")
  .eq("is_published", true)
  .eq("visibility", "public")
```

## Bad

```typescript
// Using admin client for reads — bypasses RLS!
const admin = createAdminClient()
const { data } = await admin.from("rules").select("*")
```

---

## Write restrictive RLS policies — deny by default

**Impact: CRITICAL (A permissive USING (true) policy on a table with sensitive data exposes all rows to all users, negating the purpose of RLS.)**

## Why This Matters

RLS is deny-by-default. With no policies, nobody can access rows. Add only what you need.

## Good

```sql
-- Only org members can see their own org's data
CREATE POLICY "org_read" ON scans
  FOR SELECT USING (is_org_member(organization_id));

-- Only published public content is visible to anon
CREATE POLICY "public_read" ON rules
  FOR SELECT USING (is_published = true AND visibility = 'public');
```

## Bad

```sql
-- DANGEROUS: Everyone can read everything
CREATE POLICY "anyone_can_read" ON scans
  FOR SELECT USING (true);
```

---

## Never pass server-only data as props to client components

**Impact: HIGH (Passing a full user object with email, role, internal IDs, or API keys as props exposes them in the client bundle.)**

## Why This Matters

Props to `"use client"` components are serialized and sent to the browser. Anyone can see them in DevTools.

## Good

```tsx
// Server component — pick only needed fields
export default async function Page() {
  const user = await getUser()
  return <UserAvatar name={user.display_name} avatarUrl={user.avatar_url} />
}
```

## Bad

```tsx
// Passes entire user object including email, role, internal IDs
export default async function Page() {
  const user = await getUser()
  return <UserAvatar user={user} />  // all fields visible in browser!
}
```

---

## Enable RLS on every table

**Impact: CRITICAL (A single table without RLS allows any user with the anon key to read, insert, update, and delete all rows. This is the most common Supabase security mistake.)**

## Why This Matters

Supabase exposes your database via a REST API using the anon key (which is public). Without RLS:
- Any browser can query the table directly
- No authentication required
- Full CRUD access to all rows

## Good

```sql
CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id)
);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view scans"
  ON public.scans FOR SELECT
  USING (is_org_member(organization_id));
```

## Bad

```sql
CREATE TABLE public.scans (...);
-- Forgot to enable RLS — table is fully public!
```

---

## Call auth.getUser() immediately after creating the server client in middleware

**Impact: CRITICAL (Running code between client creation and getUser() can corrupt the session cookie state, causing users to be randomly logged out with no clear cause.)**

## Why This Matters

This is a documented Supabase requirement. The auth session must be refreshed immediately after client creation in middleware.

## Good

```typescript
// middleware.ts
const supabase = createServerClient(url, key, { cookies: { ... } })

// IMPORTANT: Call getUser() IMMEDIATELY
const { data: { user } } = await supabase.auth.getUser()

if (!user && !isPublicRoute(request.nextUrl.pathname)) {
  return NextResponse.redirect(new URL("/login", request.url))
}
```

## Bad

```typescript
const supabase = createServerClient(url, key, { cookies: { ... } })

// DON'T put code here — causes random logouts!
const someData = await doSomething()

const { data: { user } } = await supabase.auth.getUser()
```

---

## Never expose the service_role key to the client

**Impact: CRITICAL (The service_role key bypasses ALL Row Level Security policies. If leaked to the browser, any user can read, modify, or delete ALL data in your database.)**

## Why This Matters

The service_role key is a **superadmin key** that bypasses all RLS policies. In the browser:
- Any user can query any table
- Any user can modify any row
- Your entire database is exposed

## Good

```env
# .env.local — server-only
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Bad

```env
# NEVER DO THIS
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Detection

Search for `NEXT_PUBLIC_SUPABASE_SERVICE` in all env files and code.

---

## Never use the admin client for reads in server actions

**Impact: HIGH (Using the admin client for reads bypasses all access controls. A missing WHERE clause returns all data across all organizations.)**

## Why This Matters

`createAdminClient()` bypasses RLS — it sees all data. Using it for reads removes your safety net.

## Good

```typescript
export async function getRule(slug: string) {
  const supabase = await createClient()  // RLS enforced
  return supabase.from("rules").select("*").eq("slug", slug).single()
}
```

## Bad

```typescript
export async function getRule(slug: string) {
  const admin = createAdminClient()  // Bypasses RLS!
  return admin.from("rules").select("*").eq("slug", slug).single()
}
```

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

---

## Store sensitive env vars without NEXT_PUBLIC_ prefix

**Impact: CRITICAL (NEXT_PUBLIC_ variables are embedded in the client JavaScript bundle and visible to anyone with browser DevTools.)**

## Why This Matters

`NEXT_PUBLIC_` variables are **inlined into the client bundle** at build time. Anyone can see them in the browser.

## Safe to Make Public

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # anon key is safe — RLS protects data
```

## Must Stay Server-Only

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_URL=postgresql://...
GITHUB_APP_PRIVATE_KEY=...
ANTHROPIC_API_KEY=sk-...
```

---

## Never import server-only code in client components

**Impact: CRITICAL (Importing server-only modules into client components leaks secrets (database credentials, API keys) into the browser JavaScript bundle. This is a security vulnerability.)**

## Why This Matters

Next.js bundles all imports in `"use client"` files for the browser. If you import a database client, the connection string ends up in the client bundle — visible to anyone with browser DevTools.

## Good

```typescript
// lib/supabase/admin.ts
import "server-only"  // Prevents accidental client import
import { createClient } from "@supabase/supabase-js"

export const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

## Bad

```typescript
// components/dashboard.tsx
"use client"
import { adminClient } from "@/lib/supabase/admin"  // LEAKED!
```

## How to Fix

1. Add `import "server-only"` to all server-only modules
2. Next.js will throw a build error if a client component tries to import it

---

## Use requireAuth() as the first call in every authenticated server action

**Impact: HIGH (Server actions are public HTTP endpoints. Without auth checks, any unauthenticated request can trigger mutations.)**

## Why This Matters

Server actions are exposed as HTTP endpoints. Anyone can call them without authentication unless you explicitly check.

## Good

```typescript
"use server"

export async function createRule(data: FormData) {
  const { orgId, userId } = await requireAuth()
  const admin = createAdminClient()
  await admin.from("rules").insert({
    ...data,
    organization_id: orgId,
    created_by: userId,
  })
}
```

## Bad

```typescript
"use server"

export async function createRule(data: FormData) {
  const admin = createAdminClient()
  await admin.from("rules").insert(data) // No auth check!
}
```

---

## Scope all mutations to the authenticated organization

**Impact: CRITICAL (Without explicit org scoping, a bug in RLS policies could expose cross-org writes. Defense-in-depth requires both application and database checks.)**

## Why This Matters

RLS is your safety net, but application-level scoping is your primary defense.

## Good

```typescript
export async function createRule(data: FormData) {
  const { orgId } = await requireAuth()
  await admin.from("rules").insert({
    ...data,
    organization_id: orgId,  // Always scope to org
  })
}
```

## Bad

```typescript
export async function createRule(data: FormData) {
  await admin.from("rules").insert(data)
  // Missing org_id — relies entirely on RLS
}
```

---

## Test RLS policies explicitly

**Impact: HIGH (RLS policy bugs are silent -- they don't throw errors. Instead, they return data that shouldn't be visible. Only tests catch these.)**

## Why This Matters

RLS bugs are the most dangerous kind — they're **silent data breaches**. No error is thrown; you just see data you shouldn't.

## Test Scenarios

1. User A queries → only sees Org A data
2. User A queries with Org B ID → empty result
3. Anon user → only sees published public content
4. User removed from org → immediately loses access

## Example

```typescript
test("user cannot see other org's scans", async () => {
  const clientA = await createAuthenticatedClient(userA)
  const { data } = await clientA.from("scans").select("*")
  expect(data.every(s => s.organization_id === orgA.id)).toBe(true)
})
```

---

## Use three distinct Supabase client types

**Impact: CRITICAL (Using the wrong client type either exposes data (admin client in page) or blocks legitimate access (authenticated client for public content). Each has different security characteristics.)**

## Why This Matters

Each client type has different security characteristics:

| Client | RLS | Use Case |
|--------|-----|----------|
| `createClient()` | Enforced | Dashboard pages, user-facing queries |
| `createAdminClient()` | **Bypassed** | Server actions for writes, cron jobs |
| `createReadOnlyClient()` | Enforced (anon) | Public pages (explore, content) |

## Good

```typescript
// Page component — RLS enforced
const supabase = await createClient()
const { data } = await supabase.from("scans").select("*")

// Server action — needs service_role for writes
const admin = createAdminClient()
await admin.from("scans").insert({ ... })
```

## Bad

```typescript
// Page component using admin client — bypasses RLS!
const admin = createAdminClient()
const { data } = await admin.from("scans").select("*") // sees ALL orgs!
```

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

---

## Validate and sanitize all user input

**Impact: HIGH (Unvalidated input can cause type errors, constraint violations, or injection attacks. Validation at the boundary catches these early.)**

## Why This Matters

User input is untrusted. Validate at the boundary:

```typescript
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["member", "admin"]),
})

export async function inviteUser(input: unknown) {
  const data = schema.parse(input)  // Throws on invalid input
  // ... safe to use data
}
```

---

## Validate all server action inputs at the boundary

**Impact: HIGH (Without validation, malformed or malicious input can cause SQL errors, data corruption, or injection attacks.)**

## Why This Matters

Server actions can be called by anyone — they're public HTTP endpoints. Never trust the input.

## Good

```typescript
import { z } from "zod"

const CreateRuleSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(["security", "performance", "architecture", "quality"]),
  impact: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
})

export async function createRule(input: unknown) {
  const { orgId } = await requireAuth()
  const data = CreateRuleSchema.parse(input)
  // ... safe to use data
}
```

---

## Use dynamic imports for heavy client components

**Impact: MEDIUM (Large client libraries loaded eagerly increase the initial page bundle size, slowing down first contentful paint.)**

## Why This Matters

`next/dynamic` with `ssr: false` ensures heavy client components are:
- **Code-split** — loaded as a separate chunk
- **Lazy loaded** — only when the component mounts
- **Server-safe** — won't break SSR

## Good

```typescript
import dynamic from "next/dynamic"

const MarkdownEditor = dynamic(
  () => import("./markdown-editor"),
  { loading: () => <Skeleton />, ssr: false }
)
```

---

## Add indexes on foreign keys and common query filters

**Impact: MEDIUM (Missing indexes on frequently-queried foreign keys cause slow queries that degrade exponentially as table size grows.)**

## Why This Matters

PostgreSQL creates indexes on PRIMARY KEYs and UNIQUE columns automatically, but **NOT on foreign keys**.

## Good

```sql
CREATE TABLE findings (
  id uuid PRIMARY KEY,
  scan_id uuid REFERENCES scans(id),
  rule_id uuid REFERENCES rules(id)
);

CREATE INDEX idx_finding_scan ON findings(scan_id);
CREATE INDEX idx_finding_rule ON findings(rule_id);
```

## Bad

```sql
CREATE TABLE findings (
  scan_id uuid REFERENCES scans(id),  -- No index!
  rule_id uuid REFERENCES rules(id)   -- No index!
);
```

---

## Never fetch the same data in both layout and page

**Impact: MEDIUM (Unlike the native fetch() API which Next.js deduplicates, Supabase client queries run independently. Duplicate queries waste database resources and add latency.)**

## Why This Matters

Next.js deduplicates `fetch()` calls during a render pass, but **Supabase client queries are NOT deduplicated**.

## Good

```typescript
// Fetch in layout, pass to page via context or props
// OR fetch only in page, not in layout
```

## Bad

```typescript
// layout.tsx
const { data: user } = await supabase.from("profile").select("*")

// page.tsx (same route)
const { data: user } = await supabase.from("profile").select("*")
// Same query runs TWICE!
```

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

---

## Push "use client" boundary as low as possible

**Impact: HIGH (A "use client" at the page level makes the entire page client-rendered, losing all server component benefits (zero JS, SEO, streaming).)**

## Why This Matters

A `"use client"` on a page file makes **everything in that file** client-rendered — including data that could have been fetched on the server.

## Good

```tsx
// components/like-button.tsx — small client component
"use client"
export function LikeButton({ ruleId }: { ruleId: string }) {
  return <button onClick={() => likeRule(ruleId)}>Like</button>
}

// page.tsx — server component (no "use client")
export default async function RulePage({ params }) {
  const rule = await getRule(params.slug)
  return (
    <div>
      <h1>{rule.title}</h1>
      <p>{rule.description}</p>
      <LikeButton ruleId={rule.id} />
    </div>
  )
}
```

---

## Use (select auth.uid()) instead of auth.uid() in policies

**Impact: MEDIUM (Without the select wrapper, auth.uid() may be re-evaluated for every row in the table, degrading performance on large tables.)**

## Why This Matters

PostgreSQL may evaluate `auth.uid()` per-row without the subquery wrapper. On a table with millions of rows, this adds overhead.

## Good

```sql
CREATE POLICY "own_data" ON profiles
  FOR SELECT USING (id = (SELECT auth.uid()));
```

## Bad

```sql
CREATE POLICY "own_data" ON profiles
  FOR SELECT USING (id = auth.uid());  -- evaluated per row
```

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

---

## Use server components for data fetching by default

**Impact: HIGH (Client-side fetching adds loading spinners, waterfalls, exposed API endpoints, and unnecessary JavaScript to the bundle.)**

## Why This Matters

Server Components fetch data at render time with:
- **Zero client JS** — data fetching code never reaches the browser
- **No loading spinners** — page renders with data already present
- **No exposed API** — no public endpoints for attackers to discover

## Good

```tsx
// Server component — async, no "use client"
export default async function RulesPage() {
  const rules = await getRules()
  return <RuleList rules={rules} />
}
```

## Bad

```tsx
"use client"
export default function RulesPage() {
  const [rules, setRules] = useState([])
  useEffect(() => {
    fetch("/api/rules").then(r => r.json()).then(setRules)
  }, [])
  if (!rules.length) return <Spinner />
  return <RuleList rules={rules} />
}
```

---

## Use next/image for all images

**Impact: HIGH (Raw img tags serve full-size images without optimization. next/image provides WebP/AVIF, responsive sizing, lazy loading, and CLS prevention.)**

## Why This Matters

`next/image` provides:
- **Format optimization** — serves WebP/AVIF when supported
- **Responsive sizing** — generates multiple sizes for different screens
- **Lazy loading** — images load only when visible
- **CLS prevention** — reserves space to prevent layout shift

## Good

```tsx
import Image from "next/image"

<Image src="/hero.jpg" alt="Hero" width={800} height={400} />
```

## Bad

```tsx
<img src="/hero.jpg" alt="Hero" />  // No optimization!
```

---

## Colocate page files with their route segment

**Impact: MEDIUM (Scattering related files across directories increases navigation time and makes data dependencies unclear.)**

## Why This Matters

Colocating route files keeps related logic together:
- `page.tsx` — the route component
- `loading.tsx` — loading UI (automatic Suspense boundary)
- `error.tsx` — error boundary
- `layout.tsx` — shared layout

## Good

```
app/(content)/rules/[slug]/
  page.tsx
  loading.tsx
  error.tsx
```

## Bad

```
app/(content)/rules/[slug]/page.tsx
components/rules/RuleLoading.tsx   # loading state far from page
utils/rules/fetchRule.ts           # data fetching far from page
```

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

---

## Keep server actions in dedicated files

**Impact: HIGH (Inline server actions mix data mutation logic with UI rendering, making them harder to test, reuse, and reason about.)**

## Why This Matters

Server actions in dedicated files are:
- **Reusable** across multiple pages
- **Testable** in isolation (no component rendering needed)
- **Clear** about what mutations exist

## Good

```typescript
// lib/rule-actions.ts
"use server"

export async function createRule(data: FormData) {
  const { orgId } = await requireAuth()
  // ... create rule scoped to org
}
```

## Bad

```typescript
// app/rules/page.tsx
export default function RulesPage() {
  async function handleCreate() {
    "use server"
    // action logic mixed with UI
  }
  return <form action={handleCreate}>...</form>
}
```

---

## Query Supabase directly in server components — skip API routes

**Impact: HIGH (Unnecessary API routes add latency, code, and maintenance burden without security benefit when server components already run on the server.)**

## Why This Matters

Server components run on the server — they can query Supabase directly. Creating an API route that just calls Supabase and returns the result is unnecessary indirection.

## Good

```typescript
// app/(content)/rules/page.tsx (server component)
const supabase = await createClient()
const { data: rules } = await supabase.from("rules").select("*")
```

## Bad

```typescript
// app/api/rules/route.ts — unnecessary middleman
export async function GET() {
  const { data } = await supabase.from("rules").select("*")
  return Response.json(data)
}

// page.tsx — calls the unnecessary API route
const rules = await fetch("/api/rules").then(r => r.json())
```

**Exception:** API routes ARE needed for: webhooks, external consumers, OAuth callbacks, cron jobs.

---

## Use a helper function for org-scoped RLS checks

**Impact: HIGH (Repeating the access check logic inline in every policy is error-prone. A centralized helper ensures consistency and is easier to update.)**

## Why This Matters

A centralized helper function:
- **Single source of truth** for access logic
- **Easy to update** — change one function, all policies use it
- **SECURITY DEFINER** — runs with elevated privileges to check profile table

## Good

```sql
CREATE FUNCTION is_org_member(org_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profile
    WHERE user_id = auth.uid()
    AND organization_id = org_id
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- All policies use the same helper
CREATE POLICY "org_access" ON scans USING (is_org_member(organization_id));
CREATE POLICY "org_access" ON findings USING (is_org_member(organization_id));
```

---

## Use route groups to organize app sections

**Impact: HIGH (Without route groups, the app directory becomes a flat list of routes that share the same layout. This makes it impossible to have different layouts per section and harder to navigate as the app grows.)**

## Why This Matters

Route groups in Next.js App Router allow you to:
- Apply **different layouts** per section (auth has minimal layout, dashboard has sidebar)
- **Organize routes** without affecting the URL structure
- Keep the `app/` directory **scalable** as you add more pages

## Good

```
app/
  (auth)/login/page.tsx
  (dashboard)/overview/page.tsx
  (content)/rules/[slug]/page.tsx
  (marketing)/pricing/page.tsx
```

## Bad

```
app/
  login/page.tsx
  overview/page.tsx
  rules/[slug]/page.tsx
  pricing/page.tsx
```

## How to Fix

Create route groups by wrapping directory names in parentheses. The parentheses are stripped from the URL.

```bash
mkdir -p app/(auth) app/(dashboard) app/(content) app/(marketing)
```

---

## Use SWR or React Query for client-side real-time data

**Impact: MEDIUM (Manual useEffect + useState + fetch patterns require re-implementing caching, revalidation, error handling, and loading states that SWR handles automatically.)**

## Why This Matters

SWR and React Query provide:
- **Automatic caching** and deduplication
- **Revalidation** on focus, interval, or mutation
- **Optimistic updates** for instant UI feedback
- **Error retry** with exponential backoff

## Good

```tsx
"use client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function NotificationBell() {
  const { data, error, isLoading } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 30000,
  })
  // ...
}
```

## Bad

```tsx
"use client"
export function NotificationBell() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/notifications")
        .then(r => r.json())
        .then(setData)
        .finally(() => setLoading(false))
    }, 30000)
    return () => clearInterval(interval)
  }, [])
}
```

---

## Organize components into atoms, molecules, organisms

**Impact: MEDIUM (Without structured organization, components become a flat list that's hard to navigate and creates unclear dependency hierarchies.)**

## Why This Matters

Atomic design creates predictable component hierarchy:
- **Atoms**: Independent, no dependencies (Button, Input, Badge)
- **Molecules**: Combine atoms (SearchBar = Input + Button)
- **Organisms**: Combine molecules (Header = Logo + Nav + SearchBar)

## Good

```
components/
  atoms/
    button.tsx
    input.tsx
    badge.tsx
  molecules/
    search-bar.tsx
    form-field.tsx
  organisms/
    header.tsx
    sidebar.tsx
```

---

## Enable strict mode in tsconfig.json

**Impact: HIGH (Without strict mode, TypeScript allows implicit any types, unchecked null access, and other patterns that cause runtime crashes.)**

## Why This Matters

Strict mode enables:
- `strictNullChecks` — catch null/undefined access at compile time
- `noImplicitAny` — no silent any types
- `strictFunctionTypes` — correct function type checking

## Good

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

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

---

## Add error.tsx to every route group

**Impact: HIGH (Without per-group error boundaries, an error in one section crashes the entire app up to the root error boundary.)**

## Why This Matters

Error boundaries contain failures:
- A bug in settings doesn't crash the dashboard
- A failed API call shows a retry button, not a white screen
- Users stay in the app instead of seeing a full-page error

## Required Files

```
app/(auth)/error.tsx
app/(dashboard)/error.tsx
app/(content)/error.tsx
app/(marketing)/error.tsx
```

---

## Handle Supabase query errors explicitly

**Impact: HIGH (Ignoring the error field means your page silently renders with null data, showing blank content or crashing on null access.)**

## Why This Matters

Supabase client methods return `{ data, error }` — they **never throw**. If you destructure only `data`, errors are silently swallowed.

## Good

```typescript
const { data, error } = await supabase
  .from("rules")
  .select("*")

if (error) {
  log.error({ error }, "Failed to fetch rules")
  throw new Error(`Failed to fetch rules: ${error.message}`)
}

return data
```

## Bad

```typescript
const { data } = await supabase.from("rules").select("*")
return data  // could be null if query failed!
```

---

## Use kebab-case for file and directory names

**Impact: MEDIUM (Git on macOS is case-insensitive by default. A file renamed from MyComponent.tsx to myComponent.tsx won't be tracked as a change, causing bugs on Linux CI.)**

## Why This Matters

Case sensitivity differs between operating systems:
- **macOS/Windows**: case-insensitive (MyFile.tsx = myfile.tsx)
- **Linux**: case-sensitive (MyFile.tsx ≠ myfile.tsx)

Using kebab-case eliminates this entire class of bugs.

## Good

```
lib/rule-actions.ts
components/molecules/fancy-select.tsx
app/(content)/rules/[slug]/page.tsx
```

## Bad

```
lib/RuleActions.ts
components/molecules/FancySelect.tsx
```

**Exception:** React component files can use PascalCase if your team prefers it, but be consistent.

---

## Use moddatetime triggers for updated_at columns

**Impact: MEDIUM (Manually setting updated_at in application code is error-prone -- any code path that updates the row but forgets to set updated_at leaves stale timestamps.)**

## Why This Matters

Database triggers guarantee `updated_at` is always current, regardless of which code path updates the row.

## Good

```sql
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON rules
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);
```

## Bad

```typescript
// Some code paths forget to update the timestamp
await supabase.from("rules").update({
  title: newTitle,
  // forgot updated_at!
})
```

---

## Never use any — use unknown for truly unknown types

**Impact: HIGH (any silently turns off TypeScript for that value. Bugs propagate through the codebase without any compile-time warnings.)**

## Why This Matters

`any` is a type-system escape hatch. It disables ALL checking:

```typescript
const x: any = "hello"
x.foo.bar.baz()  // No error! Crashes at runtime.
```

## Good

```typescript
function processInput(input: unknown) {
  if (typeof input === "string") {
    return input.toUpperCase()  // Safe — narrowed to string
  }
  throw new Error("Expected string")
}
```

## Bad

```typescript
function processInput(input: any) {
  return input.toUpperCase()  // Crashes if input isn't a string
}
```

---

## Use notFound() for invalid dynamic route params

**Impact: MEDIUM (Without notFound(), invalid slugs either crash with a null access error or silently render an empty page.)**

## Why This Matters

`notFound()` triggers the nearest `not-found.tsx` page, giving users a clear 404 instead of a crash.

## Good

```typescript
import { notFound } from "next/navigation"

export default async function RulePage({ params }) {
  const rule = await getRule(params.slug)
  if (!rule) notFound()
  return <RuleDetail rule={rule} />
}
```

---

## Remember the Supabase query builder is immutable

**Impact: HIGH (This is the most common Supabase bug. The filter appears to be applied but is silently discarded, returning unfiltered data.)**

## Why This Matters

The query builder is **immutable** — each method returns a new object.

## Good

```typescript
let query = supabase.from("scans").select("*")
query = query.eq("status", "active")  // reassign!
query = query.order("created_at", { ascending: false })
const { data } = await query
```

## Bad

```typescript
let query = supabase.from("scans").select("*")
query.eq("status", "active")  // DOES NOTHING — return value discarded!
const { data } = await query   // returns ALL scans, not just active
```

---

## Return structured results from server actions

**Impact: MEDIUM (Thrown errors from server actions surface as generic "something went wrong" in the UI. Structured results enable specific error messages.)**

## Why This Matters

Structured results are:
- **Predictable** — caller always gets the same shape
- **Debuggable** — error messages are specific
- **Type-safe** — TypeScript can narrow the result

## Good

```typescript
export async function createRule(data: RuleInput) {
  try {
    const { orgId } = await requireAuth()
    const result = await admin.from("rules").insert({ ...data, organization_id: orgId })
    return { success: true, data: result.data }
  } catch (error) {
    return { success: false, error: "Failed to create rule" }
  }
}
```

---

## Return the supabaseResponse object unchanged from middleware

**Impact: HIGH (The supabaseResponse object contains updated session cookies. If you create a new response without copying them, the browser and server go out of sync.)**

## Why This Matters

Supabase sets updated session cookies on the response. If you return a different response object, those cookies are lost.

## Good

```typescript
// Always return supabaseResponse
return supabaseResponse

// If you need a custom response:
const myResponse = NextResponse.next({ request })
myResponse.cookies.setAll(supabaseResponse.cookies.getAll())
return myResponse
```

## Bad

```typescript
// Creating new response — session cookies lost!
return NextResponse.next()
```

---

## Use revalidatePath after server action mutations

**Impact: HIGH (Next.js caches aggressively. Without explicit revalidation after mutations, the UI shows stale data until the cache expires.)**

## Why This Matters

Next.js caches server component renders. After a mutation, the cached version is stale.

## Good

```typescript
"use server"
import { revalidatePath } from "next/cache"

export async function updateRule(id: string, data: RuleData) {
  const supabase = createAdminClient()
  await supabase.from("rules").update(data).eq("id", id)
  revalidatePath("/rules")
  revalidatePath(`/rules/${data.slug}`)
}
```

## Bad

```typescript
export async function updateRule(id: string, data: RuleData) {
  await supabase.from("rules").update(data).eq("id", id)
  // No revalidation — UI shows old data!
}
```

---

## Revalidate all affected paths after mutations

**Impact: MEDIUM (Revalidating only one path leaves stale data on other pages that display the same content.)**

## Why This Matters

Content often appears on multiple pages. Revalidating only one leaves others stale.

## Good

```typescript
export async function updateRule(slug: string, data: RuleData) {
  await admin.from("rules").update(data).eq("slug", slug)
  revalidatePath("/rules")
  revalidatePath(`/rules/${slug}`)
  revalidatePath("/explore")
  revalidatePath("/")
}
```

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

---

## Test server actions in isolation

**Impact: HIGH (Testing server actions through UI rendering is slow, flaky, and doesn't isolate the mutation logic from rendering concerns.)**

## Why This Matters

Server actions are pure async functions — test them like any other function.

## Good

```typescript
test("createRule requires auth", async () => {
  vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"))
  await expect(createRule(mockData)).rejects.toThrow("Unauthorized")
})

test("createRule inserts with org scope", async () => {
  vi.mocked(requireAuth).mockResolvedValue({ orgId: "org-1", userId: "user-1" })
  await createRule(mockData)
  expect(mockInsert).toHaveBeenCalledWith(
    expect.objectContaining({ organization_id: "org-1" })
  )
})
```

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

---

## Use unique, timestamped migration filenames

**Impact: HIGH (Duplicate migration timestamps cause schema_migrations conflicts, breaking deployment and requiring manual database intervention.)**

## Why This Matters

Supabase tracks applied migrations in `schema_migrations`. Duplicate timestamps cause:
- Failed `supabase db push`
- Manual cleanup required
- Deployment blocked

## Good

```
20260409120000_create_audit_rules.sql
20260409120001_create_standards_scores.sql
20260409120002_create_convention_rules.sql
```

## Bad

```
20260409120000_create_audit_rules.sql
20260409120000_create_standards_scores.sql  # DUPLICATE timestamp!
```

---

## Use error.tsx for route-level error boundaries

**Impact: HIGH (Without error.tsx, an unhandled error in any server component crashes the entire route tree up to the nearest error boundary.)**

## Why This Matters

A bug in `/settings` shouldn't crash `/dashboard`. Each route group needs its own error boundary.

## Good

```tsx
// app/(dashboard)/error.tsx
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

**Note:** `error.tsx` must be a client component (`"use client"`).

---

## Use loading.tsx for route-level loading states

**Impact: MEDIUM (Without loading.tsx, navigating to a slow page shows nothing until the server responds -- users think the app is broken.)**

## Why This Matters

Next.js wraps `page.tsx` in a Suspense boundary using `loading.tsx` as the fallback. This means:
- Navigation shows instant feedback
- The page shell renders immediately
- Slow data doesn't block the UI

## Good

```tsx
// app/(dashboard)/scans/loading.tsx
export default function Loading() {
  return <ScanListSkeleton />
}
```

---

*Generated by BeforeMerge build script on 2026-11-20.*
*Version: 1.0.0 | Rules: 53*