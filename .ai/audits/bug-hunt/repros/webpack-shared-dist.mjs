import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { fork, spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath, pathToFileURL } from 'node:url'

if (process.argv.includes('--reader')) {
  process.on('disconnect', () => process.exit(0))
  process.on('message', async file => {
    try { const mod = await import(pathToFileURL(file).href);process.send({ ok: true, defaultType: typeof mod.default }) }
    catch (error) { process.send({ ok: false, code: error.code, message: error.message }) }
  })
  process.send({ ready: true })
} else {
  const repository = fileURLToPath(new URL('../../../../', import.meta.url))
  const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-dist-overlap-')))
  const packageDir = join(scratch, 'packages/webpack'), logs = resolve(process.env.BH_EVIDENCE_DIR ?? join(scratch, 'evidence'))
  mkdirSync(logs, { recursive: true })
  const readers = new Set()
  function modules(source, target) {
    if (!existsSync(source)) return
    mkdirSync(target, { recursive: true })
    for (const entry of readdirSync(source, { withFileTypes: true })) {
      if (entry.name.startsWith('.') && !['.bin', '.pnpm'].includes(entry.name)) continue
      const from = join(source, entry.name), to = join(target, entry.name)
      if (entry.name.startsWith('@') && entry.isDirectory()) { modules(from, to);continue }
      const actual = realpathSync(from)
      symlinkSync(actual === join(repository, 'packages/webpack') ? packageDir : actual, to)
    }
  }
  function command(args, name) {
    const child = spawn(process.execPath, [join(repository, 'scripts/with-typescript-tooling-compat.mjs'), 'pnpm', '--dir', packageDir, ...args], { cwd: packageDir, env: { ...process.env, CI: 'true' }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', data => { output += data });child.stderr.on('data', data => { output += data })
    const done = once(child, 'close').then(([code, signal]) => {
      writeFileSync(join(logs, `${process.env.BH_LOG_PREFIX ?? '0196'}-${name}.log`), output)
      return { code, signal }
    })
    return { child, done }
  }
  async function reader() {
    const child = fork(fileURLToPath(import.meta.url), ['--reader'], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
    child.stdout.on('data', data => process.stdout.write(data))
    child.stderr.on('data', data => process.stderr.write(data))
    readers.add(child)
    const [ready] = await once(child, 'message');assert(ready.ready)
    return child
  }
  async function probe(child, file) {
    const result = once(child, 'message');child.send(file)
    return (await result)[0]
  }
  try {
    cpSync(join(repository, 'packages/webpack'), packageDir, { recursive: true, filter: path => !relative(join(repository, 'packages/webpack'), path).split('/').some(part => ['node_modules', '.tsbuild', '.turbo'].includes(part)) })
    cpSync(join(repository, 'shared'), join(scratch, 'shared'), { recursive: true, filter: path => !relative(join(repository, 'shared'), path).split('/').some(part => ['node_modules', '.tsbuild'].includes(part)) })
    for (const name of readdirSync(repository)) if (/^(?:tsconfig.*\.json|eslint\.config\.[cm]?js|package\.json|pnpm-workspace\.yaml)$/.test(name)) cpSync(join(repository, name), join(scratch, name))
    modules(join(repository, 'node_modules'), join(scratch, 'node_modules'))
    modules(join(repository, 'packages/webpack/node_modules'), join(packageDir, 'node_modules'))
    modules(join(repository, 'shared/node_modules'), join(scratch, 'shared/node_modules'))
    const initialBuild = await command(['build'], 'initial-build').done;assert.equal(initialBuild.code, 0)
    const beforeReader = await reader(), duringReader = await reader(), leafReader = await reader()
    const entry = join(packageDir, 'dist/index.js'), leaf = join(packageDir, 'dist/plugins/usage-graph.js')
    const before = await probe(beforeReader, entry);assert(before.ok);assert.equal(before.defaultType, 'function')
    const build = command(['build'], 'overlap-build')
    let overlap, leafOverlap, missing
    const timer = setInterval(() => {
      if (overlap || existsSync(entry) || existsSync(leaf)) return
      missing = { entry: !existsSync(entry), leaf: !existsSync(leaf), at: performance.now() }
      overlap = probe(duringReader, entry);leafOverlap = probe(leafReader, leaf)
    }, 1)
    const rebuilt = await build.done;clearInterval(timer);assert.equal(rebuilt.code, 0)
    assert(overlap, 'Expected to observe real build removing its output; no manual dist deletion used')
    const during = await overlap, leafDuring = await leafOverlap
    const afterReader = await reader(), after = await probe(afterReader, entry);assert(after.ok);assert.equal(after.defaultType, 'function')
    const result = { before, missing, during, leafDuring, after, scope: 'Actual package build overlaps fresh Node imports only in disposable copy; original tests and shared build config unchanged' }
    console.log(JSON.stringify(result))
    assert.equal(during.ok, false);assert.equal(during.code, 'ERR_MODULE_NOT_FOUND')
    assert.equal(leafDuring.ok, false);assert.equal(leafDuring.code, 'ERR_MODULE_NOT_FOUND')
    if (process.env.BH_RUN_SUITES === '1') {
      const parallel = await command(['exec', 'vitest', 'run'], 'parallel-suite').done
      const serial = await command(['exec', 'vitest', 'run', '--no-file-parallelism'], 'serial-suite').done
      console.log(JSON.stringify({ parallel, serial, scope: 'Unmodified copied seven-file Webpack suite; its rebuild writes copied dist only' }))
      assert.equal(serial.code, 0)
    }
  } finally {
    for (const child of readers) {
      if (child.exitCode !== null || child.signalCode !== null) continue
      const exited = once(child, 'exit');child.kill('SIGTERM');await exited
    }
    rmSync(scratch, { recursive: true, force: true })
  }
}
