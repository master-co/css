// Local maintenance only: explicit output roots, no source/worktree removal.
import process from 'node:process'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  existsSync,
} from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const DAY = 86_400_000
const protectedName =
  /^(?:\.git|\.keep|\.retain|\.storage-keep|\.env(?:\..*)?)$/u
const sourceAsset =
  /\.(?:blend\d*|fbx|gltf|glb|psd|psb|ai|kra|xcf|aep|c4d|ma|mb|usd|usdz)$/iu
const within = (parent, path) =>
  path === parent || path.startsWith(parent + sep)
function canonical(path) {
  let parent = resolve(path)
  const tail = []
  while (!existsSync(parent) && dirname(parent) !== parent) {
    tail.unshift(parent.split(sep).at(-1))
    parent = dirname(parent)
  }
  try {
    return join(realpathSync(parent), ...tail)
  } catch {
    return resolve(path)
  }
}
const normalizeActivity = (activity) => ({
  ...activity,
  open: (activity.open ?? []).map(canonical),
  working: (activity.working ?? []).map(canonical),
})
const git = (root, args) =>
  execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 32 * 1024 ** 2,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  })

function safePath(root, path) {
  if (
    isAbsolute(path) ||
    path.split(/[\\/]/u).some((p) => ['.git', '..'].includes(p))
  ) {
    throw new Error(`Unsafe retention path: ${path}`)
  }
  const absolute = resolve(root, path)
  if (absolute === root || !within(root, absolute))
    throw new Error('Retention root escapes repository')
  let current = root
  for (const part of relative(root, absolute).split(sep)) {
    current = join(current, part)
    if (!existsSync(current)) break
    if (lstatSync(current).isSymbolicLink())
      throw new Error(`Symlink in retention path: ${path}`)
  }
  return absolute
}

function inspectTree(path) {
  let bytes = 0,
    newest = 0,
    count = 0,
    blocked = ''
  const pending = [path]
  while (pending.length && !blocked) {
    const item = pending.pop()
    const name = item.split(sep).at(-1)
    const stat = lstatSync(item)
    if (++count > 250_000) {
      blocked = 'scan-limit'
      break
    }
    if (stat.isSymbolicLink()) {
      blocked = 'symlink'
      break
    }
    if (stat.isDirectory() && (stat.mode & 0o222) === 0) {
      blocked = 'read-only-directory'
      break
    }
    if (protectedName.test(name) || sourceAsset.test(name)) {
      blocked = 'pinned-or-source'
      break
    }
    newest = Math.max(newest, stat.mtimeMs)
    if (stat.isDirectory()) {
      pending.push(...readdirSync(item).map((child) => join(item, child)))
    } else if (stat.isFile()) bytes += stat.size
    else blocked = 'special-file'
  }
  return { bytes, newest, count, blocked }
}

export function activitySnapshot() {
  // Fail closed on platforms without a reliable open-file inventory.
  if (!['darwin', 'linux'].includes(process.platform)) {
    return {
      available: false,
      reason: 'open-file inspection unavailable on this platform',
    }
  }
  const run = (command, args) =>
    spawnSync(command, args, {
      encoding: 'utf8',
      maxBuffer: 128 * 1024 ** 2,
      timeout: 20_000,
    })
  const ps = run('ps', ['-axo', 'pid,ppid,comm'])
  const cwd = run('lsof', ['-nP', '-a', '-d', 'cwd', '-F', 'pn'])
  const files = run('lsof', ['-nP', '-F', 'n'])
  if (
    [ps, cwd, files].some((r) => r.error || r.status !== 0 || r.stderr.trim())
  ) {
    return {
      available: false,
      reason: 'process/open-file inspection failed or incomplete',
    }
  }
  const processes = new Map(
    ps.stdout
      .split('\n')
      .slice(1)
      .flatMap((line) => {
        const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/u)
        return match
          ? [[Number(match[1]), { parent: Number(match[2]), name: match[3] }]]
          : []
      }),
  )
  const ancestors = new Set()
  for (
    let pid = process.pid;
    pid > 1 && !ancestors.has(pid);
    pid = processes.get(pid)?.parent ?? 0
  ) {
    ancestors.add(pid)
  }
  let pid = 0
  const working = []
  for (const line of cwd.stdout.split('\n')) {
    if (line.startsWith('p')) pid = Number(line.slice(1))
    else if (line.startsWith('n') && !ancestors.has(pid)) {
      const name = processes.get(pid)?.name.split('/').at(-1)
      if (!['zsh', 'bash', 'sh', 'fish', 'lsof', 'ps'].includes(name))
        working.push(line.slice(1))
    }
  }
  return {
    available: true,
    working,
    open: files.stdout
      .split('\n')
      .filter((line) => line.startsWith('n/'))
      .map((line) => line.slice(1)),
  }
}

function groupsFor(root, rule) {
  const directory = safePath(root, rule.path)
  if (!existsSync(directory)) return []
  if (
    ['.keep', '.retain', '.storage-keep'].some((name) =>
      existsSync(join(directory, name)),
    )
  )
    return []
  if (rule.mode === 'whole') return [[directory]]
  const names = readdirSync(directory).filter(
    (name) =>
      !name.startsWith('.') &&
      !(rule.exclude ?? []).includes(name) &&
      (!rule.namePattern || new RegExp(rule.namePattern, 'u').test(name)),
  )
  if (rule.mode !== 'turbo')
    return names.map((name) => [join(directory, name)])
  const groups = new Map()
  for (const name of names) {
    const match = name.match(/^([a-f0-9]{16,64})\.(?:tar\.zst|json)$/u)
    if (!match) continue
    const group = groups.get(match[1]) ?? []
    group.push(join(directory, name))
    groups.set(match[1], group)
  }
  return [...groups.values()]
}

export function planRetention(
  root,
  policy,
  { now = Date.now(), activity = activitySnapshot() } = {},
) {
  if (policy.version !== 1 || !Array.isArray(policy.rules))
    throw new Error('Invalid retention policy')
  root = realpathSync(root)
  activity = normalizeActivity(activity)
  if (
    realpathSync(git(root, ['rev-parse', '--show-toplevel']).trim()) !== root
  ) {
    throw new Error('Retention must be anchored to the checkout root')
  }
  const plans = []
  const commonGit = resolve(
    root,
    git(root, ['rev-parse', '--git-common-dir']).trim(),
  )
  for (const rule of policy.rules) {
    if (
      ![rule.maxAgeDays, rule.maxGiB, rule.keepNewest, rule.quietHours].every(
        (n) => Number.isFinite(n) && n >= 0,
      ) ||
      !['children', 'whole', 'turbo'].includes(rule.mode)
    ) {
      throw new Error(`Invalid retention rule: ${rule.path}`)
    }
    const base = rule.common ? dirname(commonGit) : root
    if (rule.common && commonGit.split(sep).at(-1) !== '.git')
      throw new Error('Unsupported common Git directory')
    const tracked = git(base, ['ls-files', '-z'])
      .split('\0')
      .filter(Boolean)
      .map((p) => resolve(base, p))
    const entries = groupsFor(base, rule)
      .map((paths) => {
        const stats = paths.map(inspectTree)
        let blocked = stats.find((s) => s.blocked)?.blocked ?? ''
        if (!activity.available) blocked ||= activity.reason
        if (paths.some((p) => tracked.some((t) => within(p, t))))
          blocked ||= 'tracked-content'
        for (const p of paths) {
          try {
            git(base, ['check-ignore', '-q', '--', relative(base, p)])
          } catch {
            blocked ||= 'not-ignored'
          }
        }
        if (
          paths.some(
            (p) =>
              (activity.open ?? []).some((f) => within(p, f)) ||
              (activity.working ?? []).some((cwd) => within(p, cwd)),
          )
        )
          blocked ||= 'in-use'
        // Turbo worktrees can share the main checkout cache. Do not prune it during another task.
        if (
          rule.mode === 'turbo' &&
          (activity.working ?? []).some((cwd) => within(base, cwd))
        ) {
          blocked ||= 'active-build-worktree'
        }
        const newest = Math.max(...stats.map((s) => s.newest))
        if (newest > now - rule.quietHours * 3_600_000) blocked ||= 'recent'
        return {
          base,
          mode: rule.mode,
          paths,
          stats,
          newest,
          bytes: stats.reduce((n, s) => n + s.bytes, 0),
          blocked,
          reason: '',
        }
      })
      .sort((a, b) => b.newest - a.newest)
    let retainedBytes = entries.reduce((n, e) => n + e.bytes, 0)
    for (const entry of entries) {
      if (!entry.blocked && entry.newest < now - rule.maxAgeDays * DAY) {
        entry.reason = 'expired'
        retainedBytes -= entry.bytes
      }
    }
    // keepNewest applies to size eviction only; expiry still applies to old runs.
    for (
      let i = entries.length - 1;
      i >= rule.keepNewest && retainedBytes > rule.maxGiB * 1024 ** 3;
      i--
    ) {
      const entry = entries[i]
      if (!entry.blocked && !entry.reason) {
        entry.reason = 'budget'
        retainedBytes -= entry.bytes
      }
    }
    plans.push({
      path: rule.path,
      entries,
      retainedBytes,
      budgetBytes: rule.maxGiB * 1024 ** 3,
      overBudget: retainedBytes > rule.maxGiB * 1024 ** 3,
    })
  }
  return { root, activityAvailable: activity.available, plans }
}

export function applyPlan(
  plan,
  activity = activitySnapshot(),
  remove = rmSync,
) {
  activity = normalizeActivity(activity)
  let removedBytes = 0
  for (const rule of plan.plans) {
    for (const entry of rule.entries.filter((e) => e.reason)) {
      try {
        const tracked = git(entry.base, ['ls-files', '-z'])
          .split('\0')
          .filter(Boolean)
          .map((p) => resolve(entry.base, p))
        if (
          !activity.available ||
          entry.paths.some(
            (p) =>
              tracked.some((t) => within(p, t)) ||
              (activity.open ?? []).some((f) => within(p, f)) ||
              (activity.working ?? []).some((cwd) => within(p, cwd)),
          ) ||
          (entry.mode === 'turbo' &&
            (activity.working ?? []).some((cwd) => within(entry.base, cwd)))
        ) {
          entry.blocked = 'newly-protected'
          entry.reason = ''
          continue
        }
        for (const path of entry.paths) {
          safePath(entry.base, relative(entry.base, path))
          git(entry.base, [
            'check-ignore',
            '-q',
            '--',
            relative(entry.base, path),
          ])
        }
        let pinned = false
        for (
          let parent = dirname(entry.paths[0]);
          within(entry.base, parent);
          parent = dirname(parent)
        ) {
          if (
            ['.keep', '.retain', '.storage-keep'].some((name) =>
              existsSync(join(parent, name)),
            )
          )
            pinned = true
          if (parent === entry.base) break
        }
        if (pinned) {
          entry.blocked = 'new-pin'
          entry.reason = ''
          continue
        }
        // Recheck descendant mtimes, type, pins and size immediately before deletion.
        const current = entry.paths.map(inspectTree)
        if (
          current.some(
            (s, i) =>
              s.blocked ||
              s.newest !== entry.stats[i].newest ||
              s.count !== entry.stats[i].count ||
              s.bytes !== entry.stats[i].bytes,
          )
        ) {
          entry.blocked = 'changed-during-scan'
          entry.reason = ''
          continue
        }
        for (const path of entry.paths) remove(path, { recursive: true })
        removedBytes += entry.bytes
        entry.removed = true
      } catch (error) {
        // Preserve remainders; never chmod or force-retry a busy/read-only tree.
        entry.blocked = 'deletion-error'
        entry.reason = ''
        entry.error = { code: error.code ?? 'UNKNOWN', message: error.message }
      }
    }
    rule.retainedBytes = rule.entries
      .filter((entry) => !entry.removed)
      .reduce((bytes, entry) => bytes + entry.bytes, 0)
    rule.overBudget = rule.retainedBytes > rule.budgetBytes
  }
  return removedBytes
}

export function runRetention(root, policy, { apply = false, ...options } = {}) {
  const gitDir = resolve(
    root,
    git(root, ['rev-parse', '--git-path', 'storage-retention.lock']).trim(),
  )
  let locked = false
  try {
    if (apply) {
      try {
        mkdirSync(gitDir)
        locked = true
        writeFileSync(join(gitDir, 'pid'), String(process.pid))
      } catch (error) {
        if (error.code === 'EEXIST')
          return {
            skipped:
              'another cleanup owns the lock (inspect stale locks manually)',
          }
        throw error
      }
    }
    const plan = planRetention(root, policy, options)
    const removedBytes = apply
      ? applyPlan(plan, options.activity ?? activitySnapshot())
      : 0
    const errors = plan.plans
      .flatMap((rule) => rule.entries)
      .filter((entry) => entry.error)
      .map((entry) => ({ paths: entry.paths, ...entry.error }))
    return { ...plan, apply, removedBytes, errors }
  } finally {
    if (locked) rmSync(gitDir, { recursive: true })
  }
}

function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => !['--apply', '--json', '--auto'].includes(arg))) {
    throw new Error('Usage: storage-retention.mjs [--apply] [--json] [--auto]')
  }
  const directory = dirname(fileURLToPath(import.meta.url))
  const policy = JSON.parse(
    readFileSync(join(directory, 'storage-retention.json'), 'utf8'),
  )
  const result = runRetention(resolve(directory, policy.root), policy, {
    apply: args.includes('--apply'),
  })
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2))
  else {
    const candidates =
      result.plans?.flatMap((p) => p.entries).filter((e) => e.reason) ?? []
    const bytes = candidates.reduce((n, e) => n + e.bytes, 0)
    console.log(
      `[storage] ${result.apply ? 'removed' : 'preview'} ${(bytes / 1024 ** 3).toFixed(2)} GiB; ${candidates.length} groups`,
    )
    if (result.skipped) console.log(`[storage] ${result.skipped}`)
    for (const error of result.errors ?? []) {
      console.error(
        `[storage] kept remainder (${error.code}): ${error.paths[0]}`,
      )
    }
    if (result.activityAvailable === false)
      console.log(
        '[storage] kept all outputs: open-file inspection unavailable',
      )
    for (const rule of result.plans ?? [])
      if (rule.overBudget) {
        console.log(
          `[storage] ${rule.path} remains above budget; recent, pinned or in-use outputs retained`,
        )
      }
  }
  if (result.errors?.length && !args.includes('--auto')) process.exitCode = 1
}

if (
  process.argv[1] &&
  canonical(process.argv[1]) === canonical(fileURLToPath(import.meta.url))
) {
  try {
    main()
  } catch (error) {
    console.error(`[storage] ${error.message}`)
    // Housekeeping must never mask a test/build result or block an otherwise valid task.
    process.exitCode = process.argv.includes('--auto') ? 0 : 1
  }
}
