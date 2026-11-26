#!/usr/bin/env node

/**
 * BeforeMerge Lint Script
 *
 * Quality and provenance gate for every skill and rule. Zero dependencies.
 * Exit code 0 = clean, 1 = at least one error. Warnings never fail.
 *
 * Usage: node scripts/lint.js [skill-dir-name ...]
 *
 * Per skill (skills/<dir>/):
 *   - SKILL.md has a closed frontmatter block
 *   - only Agent Skills spec fields at the top level of SKILL.md
 *     (name, description, license, compatibility, metadata, allowed-tools)
 *   - `name` is lowercase-hyphen, <= 64 chars, and equals `beforemerge-<dir>`
 *     (install.sh installs each skill into a folder named after `name`, so the
 *     installed copy meets the spec rule that name matches its directory)
 *   - `description` is 1-1024 chars (the Agent Skills limit)
 *   - metadata.json parses and declares a non-empty `sources` list
 *   - SKILL.md body over 500 lines is a warning
 *
 * Per rule (skills/<dir>/rules/<category>/<prefix>-*.md, `_*.md` skipped):
 *   - closed frontmatter with `title`, `impact` and a non-empty `sources` list
 *   - every source is a CWE id, an OWASP Top 10 id, a CVE id, a GHSA id,
 *     an https URL, or `operator_experience` (BeforeMerge's own incident data)
 *   - file prefix is a known section (sec, perf, arch, qual)
 *
 * Every text file under skills/:
 *   - no literal control characters (they make the file binary to grep)
 *   - no unquoted frontmatter value containing ': ' (strict YAML parsers reject it)
 *   - no real-looking secrets (AWS keys, private key blocks, JWTs, tokens)
 *
 * Several checks are adapted from scripts/lint_skills.py in
 * elementalsouls/Claude-BugHunter (MIT, Copyright (c) 2026 Sachin Sharma).
 */

const fs = require('fs')
const path = require('path')

const SKILLS_DIR = path.join(__dirname, '..', 'skills')

const NAME_PREFIX = 'beforemerge-'
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_NAME = 64
const MAX_DESC = 1024
const MAX_BODY_LINES = 500
const ALLOWED_SKILL_FIELDS = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
])
const SECTION_PREFIXES = new Set(['sec', 'perf', 'arch', 'qual'])

const SOURCE_PATTERNS = [
  /^CWE-\d+$/,
  /^OWASP-A\d{2}:20\d{2}$/,
  /^CVE-\d{4}-\d{4,}$/,
  /^GHSA(-[23456789cfghjmpqrvwx]{4}){3}$/,
  /^https:\/\/[^\s"',]+$/,
  /^operator_experience$/,
]

const SECRET_PATTERNS = [
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/],
  ['Slack token', /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['GitHub token', /\bgh[pousr]_[0-9A-Za-z]{36}\b/],
  ['Stripe live key', /\b[sr]k_live_[0-9A-Za-z]{24,}\b/],
]
// Documentation placeholders that look like secrets but are not.
const SECRET_ALLOW = /EXAMPLE|\.\.\.|<[^>]+>|x{8,}/i

// ─── Parsing ─────────────────────────────────────────────────────────────────

function splitFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return { error: "no frontmatter block (file must start with '---')" }
  const lines = raw.split('\n')
  const close = lines.indexOf('---', 1)
  if (close === -1) return { error: "frontmatter opened with '---' but never closed" }
  const fm = {}
  const fmLines = lines.slice(1, close)
  for (const line of fmLines) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (m) fm[m[1]] = m[2].trim()
  }
  return { fm, fmLines, body: lines.slice(close + 1).join('\n') }
}

function unquote(s) {
  s = s.trim()
  if (s.length >= 2 && s[0] === s[s.length - 1] && (s[0] === '"' || s[0] === "'")) return s.slice(1, -1)
  return s
}

function parseList(value) {
  if (!value || !value.startsWith('[') || !value.endsWith(']')) return null
  const inner = value.slice(1, -1).trim()
  if (!inner) return []
  return inner.split(',').map(unquote).filter(Boolean)
}

// ─── Checks shared by every file ─────────────────────────────────────────────

function controlCharErrors(rel, raw) {
  const errs = []
  for (let i = 0; i < raw.length && errs.length < 5; i++) {
    const code = raw.charCodeAt(i)
    if ((code < 32 && code !== 9 && code !== 10) || code === 127) {
      const line = raw.slice(0, i).split('\n').length
      errs.push(`${rel}:${line}: literal control character 0x${code.toString(16).padStart(2, '0')}`)
    }
  }
  return errs
}

function yamlSafetyErrors(rel, fmLines) {
  const errs = []
  for (const line of fmLines) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/)
    if (!m) continue
    const val = m[2].trim()
    const quoted = val.length >= 2 && val[0] === val[val.length - 1] && (val[0] === '"' || val[0] === "'")
    if (!quoted && !val.startsWith('[') && val.includes(': ')) {
      errs.push(`${rel}: frontmatter \`${m[1]}\` is unquoted and contains ': '; wrap it in double quotes`)
    }
  }
  return errs
}

function secretErrors(rel, raw) {
  const errs = []
  raw.split('\n').forEach((line, i) => {
    for (const [label, re] of SECRET_PATTERNS) {
      const m = line.match(re)
      if (!m) continue
      const window = line.slice(Math.max(0, m.index - 8), m.index + m[0].length + 8)
      if (SECRET_ALLOW.test(window)) continue
      errs.push(`${rel}:${i + 1}: possible ${label}: '${m[0].slice(0, 12)}...'`)
    }
  })
  return errs
}

function sourceErrors(where, list) {
  if (list === null) return [`${where}: \`sources\` must be an inline list, e.g. sources: ["CWE-89", "https://..."]`]
  if (list.length === 0) return [`${where}: \`sources\` is empty; cite where the guidance comes from (or "operator_experience")`]
  return list
    .filter((s) => !SOURCE_PATTERNS.some((re) => re.test(s)))
    .map((s) => `${where}: unrecognised source '${s}' (use CWE-n, OWASP-Ann:yyyy, CVE-..., GHSA-..., an https URL, or operator_experience)`)
}

// ─── Skill and rule checks ───────────────────────────────────────────────────

function lintSkillMd(dir, rel, raw) {
  const errors = []
  const warnings = []
  const parsed = splitFrontmatter(raw)
  if (parsed.error) return { errors: [`${rel}: ${parsed.error}`], warnings }
  const { fm, fmLines, body } = parsed
  errors.push(...yamlSafetyErrors(rel, fmLines))

  for (const key of Object.keys(fm)) {
    if (!ALLOWED_SKILL_FIELDS.has(key)) {
      errors.push(`${rel}: top-level field \`${key}\` is not in the Agent Skills spec; put it under \`metadata:\` or in metadata.json`)
    }
  }

  const name = unquote(fm.name || '')
  if (!name) errors.push(`${rel}: frontmatter missing \`name\``)
  else {
    if (!NAME_RE.test(name)) errors.push(`${rel}: \`name\` '${name}' must be lowercase letters, digits and single hyphens`)
    if (name.length > MAX_NAME) errors.push(`${rel}: \`name\` is ${name.length} chars (max ${MAX_NAME})`)
    if (name !== NAME_PREFIX + dir) errors.push(`${rel}: \`name\` '${name}' must be '${NAME_PREFIX}${dir}' to match its folder`)
  }

  const desc = unquote(fm.description || '')
  if (!desc) errors.push(`${rel}: frontmatter missing \`description\``)
  else if (desc.length > MAX_DESC) errors.push(`${rel}: description is ${desc.length} chars (max ${MAX_DESC})`)

  const bodyLines = body.split('\n').length
  if (bodyLines > MAX_BODY_LINES) warnings.push(`${rel}: body is ${bodyLines} lines (guideline ${MAX_BODY_LINES})`)

  return { errors, warnings }
}

function lintMetadataJson(rel, raw) {
  let meta
  try {
    meta = JSON.parse(raw)
  } catch (e) {
    return [`${rel}: invalid JSON (${e.message})`]
  }
  if (!Array.isArray(meta.sources)) return [`${rel}: missing \`sources\` array`]
  return sourceErrors(rel, meta.sources)
}

function lintRule(rel, file, raw) {
  const parsed = splitFrontmatter(raw)
  if (parsed.error) return [`${rel}: ${parsed.error}`]
  const { fm, fmLines } = parsed
  const errors = yamlSafetyErrors(rel, fmLines)
  if (!fm.title) errors.push(`${rel}: frontmatter missing \`title\``)
  if (!fm.impact) errors.push(`${rel}: frontmatter missing \`impact\``)
  const prefix = file.split('-')[0]
  if (!SECTION_PREFIXES.has(prefix)) errors.push(`${rel}: file prefix '${prefix}' is not one of ${[...SECTION_PREFIXES].join(', ')}`)
  if (!('sources' in fm)) errors.push(`${rel}: missing \`sources:\`; declare where this rule's guidance comes from`)
  else errors.push(...sourceErrors(rel, parseList(fm.sources)))
  return errors
}

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

function lintSkill(skillDir) {
  const dir = path.basename(skillDir)
  const errors = []
  const warnings = []
  const relOf = (p) => path.relative(path.join(SKILLS_DIR, '..'), p)

  const skillMd = path.join(skillDir, 'SKILL.md')
  if (!fs.existsSync(skillMd)) errors.push(`${relOf(skillMd)}: missing`)
  else {
    const r = lintSkillMd(dir, relOf(skillMd), fs.readFileSync(skillMd, 'utf-8'))
    errors.push(...r.errors)
    warnings.push(...r.warnings)
  }

  const metaPath = path.join(skillDir, 'metadata.json')
  if (!fs.existsSync(metaPath)) errors.push(`${relOf(metaPath)}: missing`)
  else errors.push(...lintMetadataJson(relOf(metaPath), fs.readFileSync(metaPath, 'utf-8')))

  const rulesDir = path.join(skillDir, 'rules')
  if (fs.existsSync(rulesDir)) {
    for (const entry of fs.readdirSync(rulesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      for (const file of fs.readdirSync(path.join(rulesDir, entry.name))) {
        if (!file.endsWith('.md') || file.startsWith('_')) continue
        const p = path.join(rulesDir, entry.name, file)
        errors.push(...lintRule(relOf(p), file, fs.readFileSync(p, 'utf-8')))
      }
    }
  }

  for (const p of walk(skillDir)) {
    const raw = fs.readFileSync(p, 'utf-8')
    errors.push(...controlCharErrors(relOf(p), raw), ...secretErrors(relOf(p), raw))
  }

  return { errors, warnings }
}

function lintAll(only = []) {
  const dirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && (only.length === 0 || only.includes(d.name)))
    .map((d) => path.join(SKILLS_DIR, d.name))
  const errors = []
  const warnings = []
  for (const d of dirs) {
    const r = lintSkill(d)
    errors.push(...r.errors)
    warnings.push(...r.warnings)
  }
  return { count: dirs.length, errors, warnings }
}

function report({ count, errors, warnings }) {
  for (const w of warnings) console.log(`WARN  ${w}`)
  for (const e of errors) console.error(`ERROR ${e}`)
  console.log(`Linted ${count} skill(s): ${errors.length} error(s), ${warnings.length} warning(s).`)
}

module.exports = { lintAll, report }

if (require.main === module) {
  const only = process.argv.slice(2)
  const result = lintAll(only)
  if (result.count === 0) {
    console.error(`No skills found${only.length ? ` matching ${only.join(', ')}` : ''}.`)
    process.exit(1)
  }
  report(result)
  process.exit(result.errors.length ? 1 : 0)
}
