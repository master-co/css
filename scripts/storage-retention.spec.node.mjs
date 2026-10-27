import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  utimesSync,
  existsSync,
  rmSync,
  symlinkSync,
  realpathSync,
  openSync,
  closeSync,
  copyFileSync,
  chmodSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import {
  planRetention,
  applyPlan,
  runRetention,
  activitySnapshot,
} from './storage-retention.mjs'

const DAY = 86_400_000
const now = Date.now()
const idle = { available: true, open: [], working: [] }
const policy = (changes = {}) => ({
  version: 1,
  rules: [
    {
      path: '.qa',
      mode: 'children',
      maxAgeDays: 14,
      maxGiB: 2,
      keepNewest: 3,
      quietHours: 24,
      ...changes,
    },
  ],
})
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'storage-retention-'))
  execFileSync('git', ['init', '-q', root])
  writeFileSync(join(root, '.gitignore'), '.qa/\n.turbo/\n')
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}
function run(root, name, age, { file = 'screenshot.png', bytes = 8 } = {}) {
  const path = join(root, '.qa', name)
  mkdirSync(path, { recursive: true })
  writeFileSync(join(path, file), Buffer.alloc(bytes))
  const time = new Date(now - age * DAY)
  utimesSync(join(path, file), time, time)
  utimesSync(path, time, time)
  return path
}
const options = { now, activity: idle }
const selected = (plan) =>
  plan.plans.flatMap((p) => p.entries).filter((e) => e.reason)

test('preview is read-only; expiration removes old evidence but preserves recent output', (t) => {
  const root = fixture(t),
    old = run(root, 'old', 20),
    recent = run(root, 'new', 1)
  const preview = runRetention(root, policy(), options)
  assert.equal(selected(preview).length, 1)
  assert.ok(existsSync(old))
  const result = runRetention(root, policy(), { ...options, apply: true })
  assert.equal(result.removedBytes, 8)
  assert.ok(!existsSync(old))
  assert.ok(existsSync(recent))
})
test('descendant modification protects an old directory', (t) => {
  const root = fixture(t),
    path = run(root, 'old', 20)
  utimesSync(join(path, 'screenshot.png'), new Date(now), new Date(now))
  assert.equal(selected(planRetention(root, policy(), options)).length, 0)
})
test('size eviction keeps the newest three, while expiration still applies to them', (t) => {
  const root = fixture(t)
  for (let i = 0; i < 5; i++) run(root, `run-${i}`, i + 2, { bytes: 100 })
  let plan = planRetention(root, policy({ maxGiB: 300 / 1024 ** 3 }), options)
  assert.equal(selected(plan).length, 2)
  assert.ok(selected(plan).every((e) => e.reason === 'budget'))
  plan = planRetention(root, policy({ maxAgeDays: 1 }), options)
  assert.equal(selected(plan).length, 5)
})
test('raw assets, pins, nested repositories and symlinks survive', (t) => {
  const root = fixture(t)
  run(root, 'blender', 20, { file: 'source.blend' })
  run(root, 'backup', 20, { file: 'source.blend1' })
  run(root, 'pinned', 20, { file: '.keep' })
  run(root, 'worktree', 20, { file: '.git' })
  const link = join(root, '.qa', 'linked')
  symlinkSync(root, link, 'dir')
  assert.equal(selected(planRetention(root, policy(), options)).length, 0)
})
test('a pin at the output root preserves all its runs', (t) => {
  const root = fixture(t)
  run(root, 'old', 20)
  writeFileSync(join(root, '.qa', '.keep'), '')
  assert.equal(selected(planRetention(root, policy(), options)).length, 0)
})
test('tracked output is never deleted, even if an ignore rule matches', (t) => {
  const root = fixture(t),
    path = run(root, 'tracked', 20)
  execFileSync('git', ['-C', root, 'add', '-f', '.qa/tracked/screenshot.png'])
  runRetention(root, policy(), { ...options, apply: true })
  assert.ok(existsSync(path))
})
test('missing process inspection fails closed, including unsupported platforms', (t) => {
  const root = fixture(t),
    path = run(root, 'old', 20)
  const result = runRetention(root, policy(), {
    now,
    apply: true,
    activity: { available: false, reason: 'unsupported platform' },
  })
  assert.equal(result.removedBytes, 0)
  assert.ok(existsSync(path))
})
test('open files and candidate process working directories are protected', (t) => {
  const root = fixture(t),
    first = run(root, 'open', 20),
    second = run(root, 'cwd', 20)
  const activity = {
    available: true,
    open: [join(first, 'screenshot.png')],
    working: [second],
  }
  assert.equal(
    selected(planRetention(root, policy(), { now, activity })).length,
    0,
  )
})
test('fresh activity and edits appearing after the preview are checked again', (t) => {
  const root = fixture(t),
    path = run(root, 'old', 20)
  let plan = planRetention(root, policy(), options)
  assert.equal(
    applyPlan(plan, { ...idle, open: [join(path, 'screenshot.png')] }),
    0,
  )
  plan = planRetention(root, policy(), options)
  writeFileSync(join(path, 'changed.txt'), 'new evidence')
  assert.equal(applyPlan(plan, idle), 0)
  assert.ok(existsSync(path))
})
test('path escapes and symlink ancestors are rejected', (t) => {
  const root = fixture(t)
  assert.throws(
    () => planRetention(root, policy({ path: '../elsewhere' }), options),
    /Unsafe/u,
  )
  symlinkSync(tmpdir(), join(root, '.qa'), 'dir')
  assert.throws(() => planRetention(root, policy(), options), /Symlink/u)
})
test('Turbo archives and metadata are evicted as one group; live worktrees protect the cache', (t) => {
  const root = fixture(t),
    directory = join(root, '.turbo', 'cache')
  mkdirSync(directory, { recursive: true })
  for (const suffix of ['tar.zst', 'json']) {
    const path = join(directory, `1234567890abcdef.${suffix}`)
    writeFileSync(path, 'cache')
    utimesSync(path, new Date(now - 10 * DAY), new Date(now - 10 * DAY))
  }
  const rules = policy({ path: '.turbo/cache', mode: 'turbo', maxAgeDays: 7 })
  const plan = planRetention(root, rules, options)
  assert.equal(selected(plan).length, 1)
  assert.equal(selected(plan)[0].paths.length, 2)
  assert.equal(
    selected(
      planRetention(root, rules, {
        now,
        activity: {
          ...idle,
          working: [join(root, '.claude', 'worktrees', 'active')],
        },
      }),
    ).length,
    0,
  )
})
test('another cleaner\'s lock is respected', (t) => {
  const root = fixture(t),
    path = run(root, 'old', 20)
  mkdirSync(join(root, '.git', 'storage-retention.lock'))
  const result = runRetention(root, policy(), { ...options, apply: true })
  assert.ok(result.skipped)
  assert.ok(existsSync(path))
})
test('new pins and newly tracked files after planning are preserved', (t) => {
  const root = fixture(t),
    path = run(root, 'old', 20)
  let plan = planRetention(root, policy(), options)
  writeFileSync(join(root, '.qa', '.keep'), '')
  assert.equal(applyPlan(plan, idle), 0)
  rmSync(join(root, '.qa', '.keep'))
  plan = planRetention(root, policy(), options)
  execFileSync('git', ['-C', root, 'add', '-f', '.qa/old/screenshot.png'])
  assert.equal(applyPlan(plan, idle), 0)
  assert.ok(existsSync(path))
})
test('a linked worktree locates the shared Turbo cache without deleting its checkout', (t) => {
  const root = fixture(t)
  execFileSync('git', ['-C', root, 'add', '.gitignore'])
  execFileSync('git', [
    '-C',
    root,
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@example.invalid',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '-qm',
    'fixture',
  ])
  const worktree = join(root, 'worktree')
  execFileSync('git', [
    '-C',
    root,
    'worktree',
    'add',
    '-q',
    '-b',
    'fixture-branch',
    worktree,
  ])
  const cache = join(root, '.turbo', 'cache')
  mkdirSync(cache, { recursive: true })
  const archive = join(cache, '1234567890abcdef.tar.zst')
  writeFileSync(archive, 'cache')
  utimesSync(archive, new Date(now - 10 * DAY), new Date(now - 10 * DAY))
  const rules = policy({
    path: '.turbo/cache',
    mode: 'turbo',
    common: true,
    maxAgeDays: 7,
  })
  const plan = planRetention(worktree, rules, options)
  assert.equal(selected(plan)[0].paths[0], realpathSync(archive))
  assert.equal(applyPlan(plan, idle), 5)
  assert.ok(existsSync(join(worktree, '.git')))
  assert.ok(existsSync(join(worktree, '.gitignore')))
})
test('real open-file inspection sees an old screenshot held open by a process', (t) => {
  const root = fixture(t),
    path = run(root, 'open-file', 20)
  const fd = openSync(join(path, 'screenshot.png'), 'r')
  try {
    const activity = activitySnapshot()
    if (!activity.available) {
      t.skip(activity.reason)
      return
    }
    assert.equal(
      selected(planRetention(root, policy(), { now, activity })).length,
      0,
    )
  } finally {
    closeSync(fd)
  }
})
test('automatic maintenance errors do not change the subsequent command\'s exit status', (t) => {
  const root = fixture(t),
    directory = join(root, 'scripts')
  mkdirSync(directory)
  const script = join(directory, 'storage-retention.mjs')
  copyFileSync(new URL('./storage-retention.mjs', import.meta.url), script)
  writeFileSync(join(directory, 'storage-retention.json'), 'invalid policy')
  assert.equal(
    spawnSync(process.execPath, [script, '--apply'], { encoding: 'utf8' })
      .status,
    1,
  )
  assert.equal(
    spawnSync(process.execPath, [script, '--apply', '--auto'], {
      encoding: 'utf8',
    }).status,
    0,
  )
  if (process.platform !== 'win32') {
    const command = spawnSync(
      '/bin/sh',
      [
        '-c',
        '"$1" "$2" --apply --auto && "$1" -e "process.exit(37)"',
        '_',
        process.execPath,
        script,
      ],
      { encoding: 'utf8' },
    )
    assert.equal(command.status, 37)
  }
})
test('read-only migration backups preserve the entire old run without chmod', (t) => {
  const root = fixture(t)
  const path = run(root, 'old', 20)
  const backup = join(path, 'migration-backup')
  mkdirSync(backup)
  writeFileSync(join(backup, 'database.sqlite'), 'fixture')
  const time = new Date(now - 20 * DAY)
  utimesSync(join(backup, 'database.sqlite'), time, time)
  utimesSync(backup, time, time)
  utimesSync(path, time, time)
  chmodSync(backup, 0o555)
  try {
    const plan = planRetention(root, policy(), options)
    assert.equal(selected(plan).length, 0)
    assert.equal(plan.plans[0].entries[0].blocked, 'read-only-directory')
    assert.equal(applyPlan(plan, idle), 0)
    assert.ok(existsSync(join(path, 'screenshot.png')))
    assert.ok(existsSync(join(backup, 'database.sqlite')))
  } finally {
    chmodSync(backup, 0o755)
  }
})
test('one deletion error preserves its remainder and does not discard other results', (t) => {
  const root = fixture(t),
    busy = run(root, 'busy', 20),
    old = run(root, 'removable', 21)
  const plan = planRetention(root, policy(), options)
  const removed = applyPlan(plan, idle, (path, options) => {
    if (path.endsWith('busy'))
      throw Object.assign(new Error('fixture busy'), { code: 'ENOTEMPTY' })
    rmSync(path, options)
  })
  assert.equal(removed, 8)
  assert.ok(existsSync(busy))
  assert.ok(!existsSync(old))
  const entry = plan.plans[0].entries.find((e) => e.paths[0].endsWith('busy'))
  assert.equal(entry.error.code, 'ENOTEMPTY')
  assert.equal(entry.reason, '')
})
