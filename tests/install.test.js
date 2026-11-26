// Tests for scripts/install.sh. Each test runs the real script with HOME
// pointed at a fresh temp dir, so nothing outside that dir is touched.
// Run with: node --test tests/

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const REPO = path.join(__dirname, '..')
const SCRIPT = path.join(REPO, 'scripts', 'install.sh')
const SKILLS = fs
  .readdirSync(path.join(REPO, 'skills'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
// install.sh names each installed folder after the SKILL.md `name`.
const NAMES = SKILLS.map((d) => `beforemerge-${d}`)

function tempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bm-install-'))
}

// PATH without user tool dirs, so detection only sees what the test creates.
function install(home, ...args) {
  const r = spawnSync('bash', [SCRIPT, ...args], {
    env: { HOME: home, PATH: '/usr/bin:/bin' },
    encoding: 'utf-8',
  })
  return { code: r.status, out: r.stdout + r.stderr }
}

function listTree(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    out.push(path.relative(dir, p))
    if (e.isDirectory() && !e.isSymbolicLink()) out.push(...listTree(p).map((c) => path.join(e.name, c)))
  }
  return out.sort()
}

const claudeDir = (home) => path.join(home, '.claude', 'skills')
const agentsDir = (home) => path.join(home, '.agents', 'skills')

test('--all copies every skill into both tool directories', () => {
  const home = tempHome()
  const r = install(home, '--all')
  assert.equal(r.code, 0, r.out)
  for (const root of [claudeDir(home), agentsDir(home)]) {
    assert.deepEqual(fs.readdirSync(root).sort(), [...NAMES].sort())
    SKILLS.forEach((dir, i) => {
      const dest = path.join(root, NAMES[i])
      assert.ok(!fs.lstatSync(dest).isSymbolicLink(), `${dest} should be a copy`)
      assert.equal(
        fs.readFileSync(path.join(dest, 'SKILL.md'), 'utf-8'),
        fs.readFileSync(path.join(REPO, 'skills', dir, 'SKILL.md'), 'utf-8'),
      )
      assert.ok(fs.existsSync(path.join(dest, 'rules')), `${dest}/rules missing`)
      assert.ok(fs.existsSync(path.join(dest, '.beforemerge-install')), `${dest} has no install marker`)
    })
  }
})

test('re-running is idempotent', () => {
  const home = tempHome()
  assert.equal(install(home, '--all').code, 0)
  const before = listTree(home)
  const r = install(home, '--all')
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, new RegExp(`0 installed or updated, ${NAMES.length * 2} up to date`))
  assert.deepEqual(listTree(home), before)
})

test('--dry-run writes nothing', () => {
  const home = tempHome()
  const r = install(home, '--all', '--dry-run')
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /would run: cp -R/)
  assert.deepEqual(listTree(home), [])
})

test('an existing foreign skill folder is not clobbered without --force', () => {
  const home = tempHome()
  const foreign = path.join(claudeDir(home), NAMES[0])
  fs.mkdirSync(foreign, { recursive: true })
  fs.writeFileSync(path.join(foreign, 'SKILL.md'), 'mine, not yours\n')

  const r = install(home, '--claude')
  assert.equal(r.code, 3, r.out)
  assert.match(r.out, /was not installed by this script/)
  assert.deepEqual(fs.readdirSync(foreign), ['SKILL.md'])
  assert.equal(fs.readFileSync(path.join(foreign, 'SKILL.md'), 'utf-8'), 'mine, not yours\n')
  // The other skills still install.
  assert.equal(fs.readdirSync(claudeDir(home)).length, NAMES.length)
  assert.ok(fs.existsSync(path.join(claudeDir(home), NAMES[1], '.beforemerge-install')))

  // --uninstall keeps it too.
  const u = install(home, '--claude', '--uninstall')
  assert.equal(u.code, 0, u.out)
  assert.deepEqual(fs.readdirSync(claudeDir(home)), [NAMES[0]])
  assert.equal(fs.readFileSync(path.join(foreign, 'SKILL.md'), 'utf-8'), 'mine, not yours\n')
})

test('--force replaces a foreign folder and keeps a backup outside the skills dir', () => {
  const home = tempHome()
  const foreign = path.join(claudeDir(home), NAMES[0])
  fs.mkdirSync(foreign, { recursive: true })
  fs.writeFileSync(path.join(foreign, 'SKILL.md'), 'mine, not yours\n')

  const r = install(home, '--claude', '--force')
  assert.equal(r.code, 0, r.out)
  assert.ok(fs.existsSync(path.join(foreign, '.beforemerge-install')))
  const backups = path.join(home, '.beforemerge-backups')
  const [stamp] = fs.readdirSync(backups)
  assert.equal(
    fs.readFileSync(path.join(backups, stamp, 'claude', NAMES[0], 'SKILL.md'), 'utf-8'),
    'mine, not yours\n',
  )
})

test('--link symlinks to the checkout, and --uninstall removes only our links', () => {
  const home = tempHome()
  const r = install(home, '--agents', '--link')
  assert.equal(r.code, 0, r.out)
  SKILLS.forEach((dir, i) => {
    const dest = path.join(agentsDir(home), NAMES[i])
    assert.ok(fs.lstatSync(dest).isSymbolicLink(), `${dest} should be a symlink`)
    assert.equal(fs.realpathSync(dest), fs.realpathSync(path.join(REPO, 'skills', dir)))
  })
  assert.ok(!fs.existsSync(claudeDir(home)), '--agents alone must not touch ~/.claude')

  const dry = install(home, '--agents', '--uninstall', '--dry-run')
  assert.equal(dry.code, 0, dry.out)
  assert.equal(fs.readdirSync(agentsDir(home)).length, NAMES.length)

  const u = install(home, '--agents', '--uninstall')
  assert.equal(u.code, 0, u.out)
  assert.deepEqual(fs.readdirSync(agentsDir(home)), [])
  // The repo's own skills are untouched.
  for (const dir of SKILLS) assert.ok(fs.existsSync(path.join(REPO, 'skills', dir, 'SKILL.md')))
})

test('with no target flag it installs only into detected tools', () => {
  const home = tempHome()
  fs.mkdirSync(path.join(home, '.claude'))
  const r = install(home)
  assert.equal(r.code, 0, r.out)
  assert.equal(fs.readdirSync(claudeDir(home)).length, NAMES.length)
  assert.ok(!fs.existsSync(path.join(home, '.agents')))

  const none = install(tempHome())
  assert.equal(none.code, 1, none.out)
  assert.match(none.out, /No supported agent tool detected/)
})

test('--skill limits the install to the named skills', () => {
  const home = tempHome()
  const r = install(home, '--claude', '--skill', SKILLS[0])
  assert.equal(r.code, 0, r.out)
  assert.deepEqual(fs.readdirSync(claudeDir(home)), [NAMES[0]])
})
