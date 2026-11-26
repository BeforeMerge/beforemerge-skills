# BeforeMerge

**The comprehensive, AI-native code review knowledge base.**

Know what to check — *before you merge.*

BeforeMerge is a structured collection of code review rules, anti-patterns, and best practices designed for AI coding agents and human reviewers. Each rule includes bad → good code examples, impact ratings, CWE/OWASP mappings, and detection hints.

## Why BeforeMerge?

Existing code review resources are fragmented:

- **Linters** catch syntax issues but don't educate.
- **AI review tools** are shallow — no structured knowledge base behind them.
- **OWASP/CWE docs** are exhaustive but not actionable or AI-consumable.

BeforeMerge combines **detection + education + AI-native format** in one place.

## Quick Start

Install as an Agent Skill (works with Claude Code, Cursor, Codex, OpenCode):

```bash
# Pick a skill
npx skills add BeforeMerge/beforemerge-skills --skill nextjs-review
npx skills add BeforeMerge/beforemerge-skills --skill react-review
npx skills add BeforeMerge/beforemerge-skills --skill supabase-review
npx skills add BeforeMerge/beforemerge-skills --skill fullstack-architecture-review
npx skills add BeforeMerge/beforemerge-skills --skill wordpress-review
```

Or browse the rules directly in `skills/*/rules/`.

### Install into several agent tools at once

From a clone, `scripts/install.sh` copies every skill into each agent tool it finds on your machine:

```bash
git clone https://github.com/BeforeMerge/beforemerge-skills.git
cd beforemerge-skills
bash scripts/install.sh              # every detected tool
bash scripts/install.sh --all        # both locations, detected or not
bash scripts/install.sh --link       # symlink instead of copy, so `git pull` updates everything
bash scripts/install.sh --dry-run    # show what would change
bash scripts/install.sh --uninstall  # remove what this script installed
```

| Flag | Location | Read by |
|------|----------|---------|
| `--claude` | `~/.claude/skills/` | [Claude Code](https://code.claude.com/docs/en/skills), [OpenCode](https://opencode.ai/docs/skills) |
| `--agents` | `~/.agents/skills/` | [OpenAI Codex CLI](https://learn.chatgpt.com/docs/build-skills), [OpenCode](https://opencode.ai/docs/skills) |

Each skill goes into a folder named after its `name` (for example `~/.claude/skills/beforemerge-nextjs-review/`). Re-running is safe. A folder the script did not install is never replaced unless you pass `--force`, and then the old one is moved to `~/.beforemerge-backups/`. `--skill <folder>` installs just one skill. OpenCode reads both locations, so with both populated it may warn about duplicate skill names. No sudo, no dependencies beyond bash.

## Available Skills

| Skill | Rules | Focus | Status |
|-------|-------|-------|--------|
| [`nextjs-review`](skills/nextjs-review/) | 31 | Security (XSS, CSRF, auth), performance (RSC, dynamic imports, closures), architecture | ✅ Ready |
| [`react-review`](skills/react-review/) | 16 | XSS, prototype pollution, re-renders, virtualization, composition, hooks | ✅ Ready |
| [`supabase-review`](skills/supabase-review/) | 20 | RLS security, auth patterns, query performance, migrations, type safety | ✅ Ready |
| [`fullstack-architecture-review`](skills/fullstack-architecture-review/) | 19 | DRY/SOLID, layered architecture, service/repository patterns, factory DI | ✅ Ready |
| [`wordpress-review`](skills/wordpress-review/) | 18 | SQL injection, XSS, CSRF nonces, query optimization, caching | ✅ Ready |

**104 rules** total across 5 skills.

## Structure

```
skills/
├── nextjs-review/                      # Next.js / React / TypeScript
├── react-review/                       # React (framework-agnostic)
├── supabase-review/                    # Supabase / PostgreSQL / RLS
├── fullstack-architecture-review/      # DRY / SOLID / Clean Architecture
└── wordpress-review/                   # WordPress / PHP
    ├── SKILL.md             # Agent-facing metadata + trigger description
    ├── AGENTS.md            # Compiled output (all rules in one doc)
    ├── metadata.json        # Version and organization info
    ├── README.md            # Skill-specific documentation
    └── rules/
        ├── _sections.md     # Section metadata and ordering
        ├── _template.md     # Template for contributing new rules
        ├── security/        # Security anti-patterns (CWE/OWASP mapped)
        ├── performance/     # Performance patterns
        ├── architecture/    # Architecture and design patterns
        └── quality/         # Code quality and maintainability
```

## Rule Format

Each rule is a markdown file with YAML frontmatter:

```markdown
---
title: Descriptive Rule Title
description: "One-line summary for search results"
impact: CRITICAL | HIGH | MEDIUM | LOW
tags: [security, nextjs, server-actions]
cwe: ["CWE-862"]
owasp: ["A01:2021"]
detection_grep: "pattern-to-find-violations"
sources: ["CWE-862", "OWASP-A01:2021", "https://nextjs.org/docs/app/guides/authentication"]
---

## Rule Title

Why this matters and what to look for.

**Incorrect (what's wrong and why):**

\```typescript
// Bad code example with explanation
\```

**Correct (what's right and why):**

\```typescript
// Good code example with explanation
\```

Reference: [link to official docs]
```

### Provenance

Every rule declares where its guidance comes from in `sources:`. Each entry is one of:

- a weakness or standard id: `CWE-89`, `OWASP-A03:2021`
- an advisory: `CVE-2025-29927`, `GHSA-xxxx-xxxx-xxxx`
- an `https://` link to official documentation
- `operator_experience`, for rules drawn from BeforeMerge's own incidents and reviews rather than a published source

Each skill's `metadata.json` carries a skill-level `sources` list too. (`SKILL.md` stays limited to the fields in the [Agent Skills spec](https://agentskills.io/specification), which strict validators enforce.)

`node scripts/lint.js` enforces this, along with the skill `name` matching its folder, the 1024-character description limit, no control characters and no real-looking secrets. `node scripts/build.js` runs the same checks and refuses to build on any error.

```bash
npm run lint    # provenance and structure checks
npm test        # lint and install.sh tests
npm run build   # rebuild every AGENTS.md
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Pick a skill and category (`security/`, `performance/`, `architecture/`, `quality/`)
2. Copy `rules/_template.md` to the appropriate directory
3. Follow the naming convention: `prefix-description.md` (e.g., `sec-sql-injection.md`)
4. Include bad → good code examples with explanations
5. Add CWE/OWASP mappings where applicable, and list what the rule relies on in `sources:`
6. Run `npm run lint` and `npm test`
7. Submit a PR

## Philosophy

- **Framework-specific:** Generic advice is useless. Rules target specific frameworks with specific code.
- **AI-native:** Structured for consumption by Claude Code, Cursor, Codex, and other AI agents.
- **Education-first:** Every rule explains *why*, not just *what*.
- **Formally mapped:** Rules link to CWE, OWASP, and other standards where applicable.
- **Community-driven:** Open source. The more teams contribute patterns, the better everyone's code gets.

## License

MIT — use it, fork it, improve it.

---

Built by [BeforeMerge](https://beforemerge.dev) • Created by [Peter Krzyzek](https://github.com/peterkrzyzek)
