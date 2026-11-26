// Tests for scripts/lint.js and the build gate. Each test copies scripts/ and
// skills/ into a temp dir, breaks one thing, and checks lint (and build) fail.
// Run with: node --test tests/

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const REPO = path.join(__dirname, '..')

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-lint-'))
  for (const d of ['scripts', 'skills']) fs.cpSync(path.join(REPO, d), path.join(dir, d), { recursive: true })
  return dir
}

function run(dir, script, ...args) {
  const r = spawnSync(process.execPath, [path.join(dir, 'scripts', script), ...args], { encoding: 'utf-8' })
  return { code: r.status, out: r.stdout + r.stderr }
}

function edit(dir, rel, fn) {
  const p = path.join(dir, rel)
  fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf-8')))
}

const RULE = 'skills/supabase-review/rules/security/sec-sql-injection.md'
const SKILL = 'skills/react-review/SKILL.md'

test('the repo as committed passes lint', () => {
  const r = run(REPO, 'lint.js')
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /0 error\(s\)/)
})

const cases = [
  ['a rule with no sources line', RULE, (s) => s.replace(/^sources:.*\n/m, ''), /missing `sources:`/],
  ['a rule with an empty sources list', RULE, (s) => s.replace(/^sources:.*$/m, 'sources: []'), /`sources` is empty/],
  ['a rule citing an unrecognised source', RULE, (s) => s.replace(/^sources: \[/m, 'sources: ["some blog", '), /unrecognised source 'some blog'/],
  ['a rule citing a plain-http URL', RULE, (s) => s.replace(/^sources: \[/m, 'sources: ["http://example.com", '), /unrecognised source 'http:\/\/example.com'/],
  ['a skill name that does not match its folder', SKILL, (s) => s.replace(/^name: .*$/m, 'name: beforemerge-react'), /must be 'beforemerge-react-review'/],
  ['a description over 1024 chars', SKILL, (s) => s.replace(/^description: .*$/m, `description: ${'x'.repeat(1025)}`), /description is 1025 chars/],
  ['a non-spec top-level SKILL.md field', SKILL, (s) => s.replace(/^license: .*$/m, '$&\nsources: [CWE-79]'), /`sources` is not in the Agent Skills spec/],
  ['an unquoted value containing ": "', RULE, (s) => s.replace(/^title: .*$/m, 'title: SQL: never concatenate'), /unquoted and contains ': '/],
  ['a literal control character', RULE, (s) => s.replace('## ', '## \u0000'), /control character 0x00/],
  ['a real-looking AWS key', RULE, (s) => `${s}\n${'AKIA'}${'Q3EGRZ7VT4M2KXPL'}\n`, /possible AWS access key/],
  ['metadata.json without sources', 'skills/react-review/metadata.json', (s) => s.replace(/"sources"/, '"sourcez"'), /missing `sources` array/],
]

for (const [label, rel, fn, expected] of cases) {
  test(`lint and build reject ${label}`, () => {
    const dir = sandbox()
    edit(dir, rel, fn)
    const lint = run(dir, 'lint.js')
    assert.equal(lint.code, 1, lint.out)
    assert.match(lint.out, expected)

    const agents = path.join(dir, 'skills', 'react-review', 'AGENTS.md')
    const before = fs.readFileSync(agents, 'utf-8')
    const build = run(dir, 'build.js')
    assert.equal(build.code, 1, build.out)
    assert.match(build.out, /Build aborted/)
    assert.equal(fs.readFileSync(agents, 'utf-8'), before, 'build must not write output when lint fails')
  })
}

test('documentation placeholders are not flagged as secrets', () => {
  const dir = sandbox()
  edit(dir, RULE, (s) => `${s}\nAKIAIOSFODNN7EXAMPLE\nsk_live_abc123\n`)
  const r = run(dir, 'lint.js')
  assert.equal(r.code, 0, r.out)
})
