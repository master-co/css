import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { EventEmitter, once } from 'node:events'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { execa } from 'execa'
import { candidateRegistry, consumeArchives, inspectFrameworkHTML, observeChildExit, stopChild, verifyCandidateLock } from './release-archive-consumers.mjs'

const version = '0.0.0-archive.1', revision = 'a'.repeat(40)
const alpha = '@master/archive-fixture-alpha', beta = '@master/archive-fixture-beta'
const integrity = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'archive-consumer-test-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const packages = []
  for (const name of [alpha, beta]) {
    const root = join(directory, name.split('/')[1]); await mkdir(root)
    const manifest = { name, version, gitHead: revision, type: 'module', files: ['index.js', 'install.cjs'],
      scripts: { postinstall: 'node install.cjs' },
      dependencies: name === alpha ? { [beta]: version } : {} }
    await writeFile(join(root, 'package.json'), JSON.stringify(manifest))
    await writeFile(join(root, 'index.js'), `export default ${JSON.stringify(name)}\n`)
    await writeFile(join(root, 'install.cjs'), `require('node:fs').writeFileSync(${JSON.stringify(join(directory, 'lifecycle-ran'))}, 'ran')\n`)
    const result = await execa('bun', ['pm', 'pack', '--ignore-scripts', '--destination', directory], { cwd: root })
    assert.ok(result.exitCode === 0)
    const file = `${name.replace('@', '').replace('/', '-')}-${version}.tgz`
    packages.push({ name, version, file, integrity: integrity(await readFile(join(directory, file))) })
  }
  return { directory, cohort: { revision, version, packages, missingNativeTargets: [] } }
}

test('candidate registry serves exact bytes and rejects unknown Master packages and mutations', async t => {
  const f = await fixture(t), registry = await candidateRegistry(f.directory, f.cohort)
  t.after(() => registry.close())
  const metadata = await (await fetch(`${registry.origin}/${encodeURIComponent(alpha)}`)).json()
  const actual = Buffer.from(await (await fetch(metadata.versions[version].dist.tarball)).arrayBuffer())
  assert.equal(integrity(actual), f.cohort.packages[0].integrity)
  assert.equal((await fetch(`${registry.origin}/@master/published-fallback`)).status, 404)
  assert.equal((await fetch(`${registry.origin}/@master/archive-fixture-alpha`, { method: 'PUT' })).status, 405)
  assert.equal(registry.failures.length, 2)
})

test('archive mutation fails before any package-manager installation', async t => {
  const f = await fixture(t)
  await writeFile(join(f.directory, f.cohort.packages[0].file), 'different bytes')
  await assert.rejects(candidateRegistry(f.directory, f.cohort), /Archive changed/)
})

test('each lock format rejects registry fallback, wrong versions/integrity and missing candidates', () => {
  const origin = 'http://127.0.0.1:1234', correct = 'sha512-candidate'
  const cohort = { version, packages: [{ name: alpha, version, integrity: correct }] }
  const locks = {
    npm: { packages: { [`node_modules/${alpha}`]: { version, integrity: correct, resolved: `${origin}/archives/a.tgz` } } },
    bun: { packages: { [alpha]: [`${alpha}@${version}`, `${origin}/archives/a.tgz`, {}, correct] } },
    pnpm: { packages: { [`${alpha}@${version}`]: { resolution: { integrity: correct, tarball: `${origin}/archives/a.tgz` } } } }
  }
  for (const [manager, lock] of Object.entries(locks)) {
    assert.deepEqual(verifyCandidateLock(manager, lock, cohort, origin, [alpha]), [alpha])
    for (const [from, to] of [[correct, 'sha512-wrong'], [version, '9.9.9'], [origin, 'https://registry.npmjs.org']]) {
      const corrupted = JSON.parse(JSON.stringify(lock).replaceAll(from, to))
      assert.throws(() => verifyCandidateLock(manager, corrupted, cohort, origin, [alpha]))
    }
    assert.throws(() => verifyCandidateLock(manager, lock, cohort, origin, [beta]), /absent from lock/)
  }
})

for (const manager of ['npm', 'bun', 'pnpm']) {
  test(`${manager} installs a real isolated two-package candidate dependency closure`, { timeout: 120_000 }, async t => {
    const f = await fixture(t)
    const result = await consumeArchives({ ...f, manager, smoke: false })
    assert.deepEqual(result.installed, [alpha, beta])
    assert.equal(result.noPublishedMasterFallback, true)
    assert.equal(existsSync(join(f.directory, 'lifecycle-ran')), false, 'Package lifecycle scripts must stay disabled')
    for (const pkg of f.cohort.packages) {
      assert.ok(result.requests.some(request => request.path === `archives/${pkg.file}`))
    }
  })
}

test('signaled children actually exit before cleanup completes, escalating on POSIX', { timeout: 10_000 }, async t => {
  const child = spawn(process.execPath, ['-e', 'process.on("SIGTERM",()=>{});process.stdout.write("ready");setInterval(()=>{},1000)'], { stdio: ['pipe', 'pipe', 'pipe'] })
  const observed = observeChildExit(child)
  t.after(async () => { if (!observed.hasExited()) { child.kill('SIGKILL'); await observed.exit } })
  await once(child.stdout, 'data')
  child.kill('SIGTERM')
  assert.equal(child.killed, true)
  assert.equal(observed.hasExited(), false, 'Signal sent is not process termination')
  const result = await stopChild(observed, { termTimeout: 25, killTimeout: 2000 })
  // Windows forcefully terminates on SIGTERM regardless of JavaScript handlers;
  // this proves observed termination there, not graceful shutdown-hook execution.
  const expectedSignal = process.platform === 'win32' ? 'SIGTERM' : 'SIGKILL'
  assert.equal(result.signal, expectedSignal)
  assert.equal(child.signalCode, expectedSignal)
  assert.throws(() => process.kill(child.pid, 0), { code: 'ESRCH' })
  const exited = observeChildExit(child)
  assert.deepEqual(await stopChild(exited, { termTimeout: 1, killTimeout: 1 }), result)
})

test('a signal error is not mistaken for an exited child', async () => {
  const child = Object.assign(new EventEmitter(), { pid: 123, exitCode: null, signalCode: null })
  const observed = observeChildExit(child)
  child.kill = signal => {
    if (signal === 'SIGTERM') child.emit('error', new Error('signal rejected while process is alive'))
    else setTimeout(() => { child.signalCode = 'SIGKILL'; child.emit('exit', null, 'SIGKILL') }, 10)
  }
  const result = await stopChild(observed, { termTimeout: 10, killTimeout: 1000 })
  assert.equal(result.signal, 'SIGKILL')
  assert.equal(child.signalCode, 'SIGKILL')
})

test('framework proof rejects authored prose, omitted SSR hooks and inconsistent hydration', { timeout: 30_000 }, async t => {
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch({ headless: true })
  t.after(() => browser.close())
  const style = '<style id="master-css">@layer utilities{.\\(opacity\\:0\\.73\\){opacity:0.73}}</style>'
  const payload = { version: 5, classNames: ['(opacity:0.73)'], resourceOrder: { variables: [], keyframes: [] } }
  const hydration = `<script type="application/json" id="master-css-hydration-manifest">${JSON.stringify(payload)}</script>`
  const valid = style + hydration + '<span class="(opacity:0.73)">probe</span>'
  assert.equal((await inspectFrameworkHTML(browser, valid)).generatedProbeRule, true)
  await assert.rejects(inspectFrameworkHTML(browser, '<p>Astro middleware injects style#master-css</p><style>@layer utilities{.block{display:block}}</style>'), /actual SSR style/)
  await assert.rejects(inspectFrameworkHTML(browser, valid.replace(style, '')), /actual SSR style/)
  await assert.rejects(inspectFrameworkHTML(browser, valid.replace(hydration, '')), /hydration/)
  await assert.rejects(inspectFrameworkHTML(browser, valid.replace('opacity:0.73}', 'opacity:0.5}')), /dynamic native opacity/)
  await assert.rejects(inspectFrameworkHTML(browser, valid.replace(JSON.stringify(payload), JSON.stringify({ ...payload, classNames: ['block'] }))), /cover the dynamic native probe/)
  const external = style.replace('id="master-css"', 'id="master-css" data-master-css-hydration-manifest="/_master-css/probe.json"')
  assert.equal((await inspectFrameworkHTML(browser, external, async reference => {
    assert.equal(reference, '/_master-css/probe.json'); return JSON.stringify(payload)
  })).generatedProbeRule, true)
})
