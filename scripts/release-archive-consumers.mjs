import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { existsSync, globSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execa } from 'execa'
import { registryConsumerEnvironment, registryConsumerSource } from './release-registry-consumer.mjs'
import { readWorkspacePackages, stageSnapshot } from './site-toolchain-snapshot.mjs'
import { createWorkspaceRelease, packedManifest } from './semantic-release-workspace.mjs'
import { inspectArchives } from './release-readiness.mjs'

const nativePattern = /^@master\/css-binding-(?:darwin|linux|win32)-/
const hash = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`
const json = async file => JSON.parse(await readFile(file, 'utf8'))
const fields = ['dependencies', 'optionalDependencies', 'peerDependencies']
const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Prepare the actual release archives in a disposable copy, without changing checkout versions. */
export async function prepareArchives({ root, output, version, hostOnly = false, nativeRevision }) {
  assert.match(version, /^0\.0\.0-archive\.\d+(?:\.\d+)*$/, 'Use an unpublished archive rehearsal version')
  if (nativeRevision) assert.match(nativeRevision, /^[a-f0-9]{40}$/)
  assert.equal(existsSync(output), false, 'Output directory must be fresh')
  const workspace = await readWorkspacePackages(root)
  const all = [...workspace.values()].filter(entry => !entry.manifest.private)
  const missing = all.filter(({ directory, manifest }) => nativePattern.test(manifest.name)
    && manifest.files.some(file => !existsSync(join(directory, file)))).map(entry => entry.manifest.name)
  assert.ok(hostOnly || !missing.length, `Missing native payloads: ${missing.join(', ')}; explicitly select --host-only for incomplete coverage`)
  const selected = all.filter(entry => !missing.includes(entry.manifest.name)).map(entry => {
    const manifest = structuredClone(entry.manifest)
    for (const field of fields) for (const name of Object.keys(manifest[field] ?? {})) {
      if (workspace.has(name)) manifest[field][name] = version
    }
    return { ...entry, manifest }
  })
  const revision = (await execa('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim()
  const dirty = (await execa('git', ['status', '--porcelain'], { cwd: root })).stdout
  const stage = join(output, 'workspace'), archives = join(output, 'packages')
  const plugin = createWorkspaceRelease()
  await mkdir(output, { recursive: true })
  try {
    const workspaceRoots = await stageSnapshot(selected, stage, version, revision)
    const context = { cwd: stage, env: registryConsumerEnvironment(process.env, join(output, 'prepare-cache')), nextRelease: { version, gitHead: revision } }
    for (const pkgRoot of workspaceRoots) await plugin.prepare({ pkgRoot, workspaceRoots, tarballDir: archives }, context)
    const cohort = await inspectArchives(archives, selected.map(entry => entry.manifest.name), version, revision)
    for (const pkg of cohort.packages) pkg.manifest = packedManifest(await readFile(join(archives, pkg.file)))
    Object.assign(cohort, { mode: 'assembled-archive-rehearsal', complete: !missing.length,
      publicPackageCount: all.length, missingNativeTargets: missing, dirtySource: Boolean(dirty), archives: 'packages',
      nativeArtifactRevision: nativeRevision ?? null })
    await writeFile(join(output, 'cohort.json'), JSON.stringify(cohort, null, 2) + '\n')
    return cohort
  } finally { await plugin.fail(); await rm(stage, { recursive: true, force: true }) }
}

/** Only candidate metadata/tarballs are served. Unknown Master names never fall through to npm. */
export async function candidateRegistry(directory, cohort) {
  const packages = new Map(), requests = [], failures = []
  for (const pkg of cohort.packages) {
    assert.equal(packages.has(pkg.name), false, `Duplicate archive: ${pkg.name}`)
    assert.equal(pkg.version, cohort.version)
    const bytes = await readFile(join(directory, pkg.file))
    assert.equal(hash(bytes), pkg.integrity, `Archive changed: ${pkg.name}`)
    const manifest = packedManifest(bytes)
    assert.equal(manifest.name, pkg.name); assert.equal(manifest.version, cohort.version)
    packages.set(pkg.name, { ...pkg, manifest, bytes })
  }
  const server = createServer((req, res) => {
    const send = (status, value) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value)) }
    const pathname = new URL(req.url, 'http://localhost').pathname
    const name = decodeURIComponent(pathname).replace(/^\//, '')
    requests.push({ method: req.method, path: name })
    if (req.method !== 'GET') { failures.push(name); return send(405, { error: 'Read-only candidate registry' }) }
    if (name.startsWith('archives/')) {
      const pkg = [...packages.values()].find(entry => `archives/${entry.file}` === name)
      if (!pkg) { failures.push(name); return send(404, { error: 'Unknown candidate archive' }) }
      res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': pkg.bytes.length }); res.end(pkg.bytes); return
    }
    const pkg = packages.get(name)
    if (!pkg) {
      if (!(cohort.missingNativeTargets ?? []).includes(name)) failures.push(name)
      return send(404, { error: 'No published Master fallback is allowed' })
    }
    const origin = `http://127.0.0.1:${server.address().port}`
    const manifest = { ...pkg.manifest, dist: { tarball: `${origin}/archives/${pkg.file}`, integrity: pkg.integrity } }
    send(200, { name, 'dist-tags': { latest: cohort.version }, versions: { [cohort.version]: manifest } })
  })
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  return { packages, requests, failures, origin: `http://127.0.0.1:${server.address().port}`,
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) } }
}

export function verifyCandidateLock(manager, lock, cohort, origin, required) {
  const expected = new Map(cohort.packages.map(pkg => [pkg.name, pkg])), found = new Set()
  const verify = (name, version, integrity, source) => {
    assert.ok(expected.has(name), `Unknown Master dependency: ${name}`)
    assert.equal(version, cohort.version, `Wrong candidate version: ${name}`)
    assert.equal(integrity, expected.get(name).integrity, `Wrong candidate integrity: ${name}`)
    if (source) assert.ok(source.startsWith(`${origin}/archives/`), `Published/linked Master fallback: ${name}`)
    found.add(name)
  }
  if (manager === 'npm') {
    for (const [location, pkg] of Object.entries(lock.packages ?? {})) {
      const name = location.split('node_modules/').at(-1)
      if (!name.startsWith('@master/')) continue
      if (!pkg.version && pkg.optional && (cohort.missingNativeTargets ?? []).includes(name)) continue
      verify(name, pkg.version, pkg.integrity, pkg.resolved)
    }
  } else if (manager === 'bun') {
    for (const entry of Object.values(lock.packages ?? {})) {
      if (!Array.isArray(entry) || !entry[0]?.startsWith('@master/')) continue
      const separator = entry[0].lastIndexOf('@'), name = entry[0].slice(0, separator)
      verify(name, entry[0].slice(separator + 1), entry.at(-1), entry[1] || undefined)
    }
  } else {
    for (const [key, pkg] of Object.entries(lock.packages ?? {})) {
      if (!key.startsWith('@master/')) continue
      const separator = key.lastIndexOf('@'), name = key.slice(0, separator)
      verify(name, key.slice(separator + 1), pkg.resolution?.integrity, pkg.resolution?.tarball)
    }
  }
  for (const name of required) assert.ok(found.has(name), `Candidate absent from lock: ${name}`)
  return [...found].sort()
}

// These helpers are also embedded verbatim in the disposable consumer's standalone smoke.
export function observeChildExit(child) {
  let exited = false
  const exit = new Promise(resolve => {
    const complete = (code, signal, error) => { exited = true; resolve({ code, signal, error }) }
    child.once('exit', (code, signal) => complete(code, signal))
    // An error can mean a failed signal while the child is alive. Only a failed
    // spawn (no PID) establishes that no process needs to be awaited.
    child.on('error', error => { if (child.pid === undefined) complete(null, null, error.message) })
    if (child.exitCode !== null || child.signalCode !== null) complete(child.exitCode, child.signalCode)
  })
  return { child, exit, hasExited: () => exited }
}

export async function stopChild(observed, { termTimeout = 5000, killTimeout = 5000 } = {}) {
  const wait = async milliseconds => {
    let timer
    try {
      return await Promise.race([observed.exit.then(result => ({ exited: true, result })),
        new Promise(resolve => { timer = setTimeout(() => resolve({ exited: false }), milliseconds) })])
    } finally { clearTimeout(timer) }
  }
  if (observed.hasExited()) return observed.exit
  observed.child.stdin?.end()
  observed.child.kill('SIGTERM')
  const terminated = await wait(termTimeout)
  if (terminated.exited) return terminated.result
  observed.child.kill('SIGKILL')
  const killed = await wait(killTimeout)
  if (killed.exited) return killed.result
  const error = new Error('Child exit was not confirmed after SIGKILL')
  error.code = 'CHILD_EXIT_UNCONFIRMED'
  throw error
}

export const archiveSmokeSource = registryConsumerSource + '\n' + observeChildExit.toString() + '\n' + stopChild.toString() + String.raw`
const runtime = await import('@master/css-runtime')
assert.equal(typeof runtime.MasterCSSRuntime, 'function')
const program = await import('@master/css-runtime/default-program')
assert.ok(Object.keys(program).length)
const integrations = {}
for (const name of ['@master/css-vite', '@master/css-webpack', '@master/css-astro',
  '@master/css-next', '@master/css-next/adapter', '@master/css-nuxt', '@master/css-svelte/vite',
  '@master/css-svelte-addon']) {
  integrations[name] = Object.keys(await import(name))
  assert.ok(integrations[name].length, 'Empty integration exports: ' + name)
}
assert.equal(typeof (await import('@master/css-vite')).default, 'function')
assert.equal(typeof (await import('@master/css-next')).withMasterCSS, 'function')
// These entrypoints require the framework plugin's virtual modules; plain Node cannot execute them.
const frameworkHooks = ['@master/css-astro/middleware', '@master/css-svelte/hooks.server'].map(name => ({ name, resolved: import.meta.resolve(name), executed: false }))
const createManifest = JSON.parse(readFileSync('node_modules/@master/create-css/package.json', 'utf8'))
const createCLI = join(root, 'node_modules/@master/create-css', createManifest.bin['create-css'])
const plan = JSON.parse(execFileSync(process.execPath, [createCLI, 'add', '--framework', 'none', '--dry-run', '--json', '--yes', '--no-install'], { encoding: 'utf8' }))
assert.equal(plan.framework, 'none')
const plannedMasterDependencies = plan.dependencies.filter(dependency => dependency.name.startsWith('@master/'))
assert.ok(plannedMasterDependencies.length)
for (const dependency of plannedMasterDependencies) assert.equal(dependency.version, createManifest.version,
  'Installed create-css must plan its exact candidate cohort: ' + dependency.name)
assert.ok(plan.commands.some(command => command.args.includes('@master/css-mcp@' + createManifest.version)),
  'Installed create-css MCP registration must use its exact candidate cohort')
const { spawn } = await import('node:child_process')
const { createInterface } = await import('node:readline')
const mcpManifest = JSON.parse(readFileSync('node_modules/@master/css-mcp/package.json', 'utf8'))
const child = spawn(process.execPath, [join(root, 'node_modules/@master/css-mcp', mcpManifest.bin['master-css-mcp']), '--root', root], { stdio: ['pipe', 'pipe', 'pipe'] })
const observedChild = observeChildExit(child)
let mcpChildExit
let stderr = '', counter = 0
const pending = new Map()
child.stderr.on('data', bytes => { stderr = (stderr + bytes).slice(-16384) })
const lines = createInterface({ input: child.stdout })
lines.on('line', line => { const message = JSON.parse(line); if (pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id) } })
const request = async (method, params) => {
  const id = ++counter
  const response = await Promise.race([new Promise(resolve => { pending.set(id, resolve); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n') }),
    new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('MCP timeout: ' + method + ' ' + stderr)), 30000); timer.unref() })])
  assert.equal(response.error, undefined); return response.result
}
try {
  const initialized = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'archive-rehearsal', version: '1' } })
  assert.equal(initialized.serverInfo.name, '@master/css-mcp')
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
  const tools = await request('tools/list', {})
  assert.ok(tools.tools.some(tool => tool.name === 'mastercss_render_css'))
  const rendered = await request('tools/call', { name: 'mastercss_render_css', arguments: { context: 'preset', classList: 'block' } })
  assert.equal(rendered.isError, undefined)
  const envelope = JSON.parse(rendered.content[0].text)
  assert.equal(envelope.result.status, 'success'); assert.ok(envelope.result.data.css.text.includes('display:block'))
} finally {
  mcpChildExit = await stopChild(observedChild)
  lines.close()
}
console.log(JSON.stringify({ runtimeExports: true, integrations, frameworkHooks, createCSSDryRun: true,
  createCSSCohortVersion: createManifest.version, plannedMasterDependencies, mcpGuidanceCohort: true,
  mcpStdioRender: true, mcpChildExitConfirmed: observedChild.hasExited(), mcpChildExit }))
`

async function parseLock(manager, cwd, options) {
  if (manager === 'npm') return json(join(cwd, 'package-lock.json'))
  const file = join(cwd, manager === 'bun' ? 'bun.lock' : 'pnpm-lock.yaml')
  const source = await readFile(file, 'utf8')
  const parser = manager === 'bun' ? 'JSON5' : 'YAML'
  const result = await execa('bun', ['--eval', `console.log(JSON.stringify(Bun.${parser}.parse(await Bun.stdin.text())))`], { ...options, input: source })
  return JSON.parse(result.stdout)
}

export async function inspectFrameworkHTML(browser, html, readHydration) {
  const page = await browser.newPage({ javaScriptEnabled: false })
  try {
    await page.setContent(html)
    const evidence = await page.evaluate(() => {
      const styles = document.querySelectorAll('style#master-css'), style = styles[0]
      const scripts = document.querySelectorAll('script#master-css-hydration-manifest[type="application/json"]')
      const selector = '.' + CSS.escape('(opacity:0.73)')
      const find = rules => [...rules].some(rule => rule.selectorText === selector && rule.style?.opacity === '0.73'
        || rule.cssRules && find(rule.cssRules))
      return { styleCount: styles.length, generatedProbeRule: style?.sheet ? find(style.sheet.cssRules) : false,
        inlineCount: scripts.length, inline: scripts[0]?.textContent,
        reference: style?.getAttribute('data-master-css-hydration-manifest'), css: style?.textContent }
    })
    assert.equal(evidence.styleCount, 1, 'Require one actual SSR style#master-css element')
    assert.equal(evidence.generatedProbeRule, true, 'SSR stylesheet must contain the dynamic native opacity probe rule')
    assert.ok(evidence.inlineCount === 1 || evidence.reference, 'Require inline hydration payload or its asset reference')
    assert.ok(evidence.inlineCount <= 1, 'Duplicate hydration payloads')
    const payload = JSON.parse(evidence.inlineCount ? evidence.inline : await readHydration(evidence.reference))
    assert.ok(Number.isInteger(payload.version) && payload.version > 0, 'Missing hydration version')
    assert.ok(payload.classNames?.includes('(opacity:0.73)'), 'Hydration payload must cover the dynamic native probe')
    assert.ok(Array.isArray(payload.resourceOrder?.variables) && Array.isArray(payload.resourceOrder?.keyframes), 'Malformed hydration resources')
    return { styleCount: 1, generatedProbeRule: true, reference: evidence.reference, hydration: payload,
      cssSHA256: createHash('sha256').update(evidence.css).digest('hex') }
  } finally { await page.close() }
}

async function buildFrameworkFixtures(cwd, cohort, options, artifacts) {
  const results = []
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch({ headless: true })
  try {
  for (const framework of ['astro', 'svelte']) {
    const source = join(sourceRoot, 'examples', framework), target = join(cwd, `fixture-${framework}`)
    const ignored = new Set(['node_modules', '.astro', '.svelte-kit', '.vercel', '.turbo', '.master', 'dist'])
    await cp(source, target, { recursive: true, filter: path => !relative(source, path).split(sep).some(part => ignored.has(part)) })
    const manifest = await json(join(target, 'package.json'))
    for (const field of ['dependencies', 'devDependencies']) for (const name of Object.keys(manifest[field] ?? {})) {
      if (name.startsWith('@master/')) manifest[field][name] = cohort.version
    }
    await writeFile(join(target, 'package.json'), JSON.stringify(manifest))
    if (framework === 'astro') await writeFile(join(target, 'src/pages/archive-probe.astro'), `---
import '../styles/global.css'
const probe = ['(opacity:', '0.73)'].join('')
---
<html><head><title>Archive SSR probe</title></head><body><span class={probe}>Archive SSR probe</span></body></html>`)
    else {
      await mkdir(join(target, 'src/routes/archive-probe'), { recursive: true })
      await writeFile(join(target, 'src/routes/archive-probe/+page.svelte'), `<script>const probe = ['(opacity:', '0.73)'].join('')</script>\n<span class={probe}>Archive SSR probe</span>`)
      await writeFile(join(target, 'src/routes/archive-probe/+page.js'), 'export const prerender = true\n')
    }
    const runBin = async (name, executable, args) => {
      const pkg = await json(join(cwd, 'node_modules', name, 'package.json'))
      const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin[executable]
      return execa(process.execPath, [join(cwd, 'node_modules', name, bin), ...args],
        { ...options, cwd: target, env: { ...options.env, ASTRO_TELEMETRY_DISABLED: '1', DO_NOT_TRACK: '1' } })
    }
    const output = framework === 'astro' ? 'dist/archive-probe/index.html' : '.svelte-kit/output/prerendered/pages/archive-probe.html'
    const outputRoot = join(target, framework === 'astro' ? 'dist' : '.svelte-kit/output')
    const readHydration = async reference => {
      const url = new URL(reference, 'http://candidate.invalid')
      assert.equal(url.origin, 'http://candidate.invalid', 'Hydration asset must be local')
      const suffix = decodeURIComponent(url.pathname).replace(/^\//, '')
      const files = globSync('**/*.json', { cwd: outputRoot }).filter(file => file === suffix || file.endsWith('/' + suffix))
      assert.ok(files.length, `Missing generated hydration asset: ${reference}`)
      const contents = await Promise.all(files.map(file => readFile(join(outputRoot, file), 'utf8')))
      assert.ok(contents.every(text => text === contents[0]), 'Hydration asset copies differ')
      return contents[0]
    }
    let missingHookRejected = false
    if (framework === 'svelte') {
      const hook = join(target, 'src/hooks.server.ts'), original = await readFile(hook)
      await rm(hook)
      try {
        await runBin('@sveltejs/kit', 'svelte-kit', ['sync']); await runBin('vite', 'vite', ['build'])
        const missingHook = await readFile(join(target, output), 'utf8')
        await assert.rejects(inspectFrameworkHTML(browser, missingHook, readHydration), /actual SSR style|dynamic native opacity|hydration/)
        missingHookRejected = true
      } finally { await writeFile(hook, original) }
    }
    if (framework === 'astro') await runBin('astro', 'astro', ['build'])
    else { await runBin('@sveltejs/kit', 'svelte-kit', ['sync']); await runBin('vite', 'vite', ['build']) }
    const html = await readFile(join(target, output), 'utf8')
    const evidence = await inspectFrameworkHTML(browser, html, readHydration)
    if (artifacts) {
      await mkdir(artifacts, { recursive: true }); await writeFile(join(artifacts, `${framework}.html`), html)
      await writeFile(join(artifacts, `${framework}-hydration.json`), JSON.stringify(evidence.hydration, null, 2))
    }
    results.push({ framework, manager: 'npm', exampleSourceRevision: cohort.revision,
      packageVersion: cohort.version, built: true, htmlSHA256: createHash('sha256').update(html).digest('hex'),
      ssr: evidence, missingHookRejected, virtualHookExecutedDuringPrerender: true })
  }
  } finally { await browser.close() }
  return results
}

async function browserRuntimeSmoke(cwd) {
  const script = await readFile(join(cwd, 'node_modules/@master/css-runtime/dist/global.min.js'))
  const program = await readFile(join(cwd, 'node_modules/@master/css-runtime/dist/default-program.bin'))
  let programRequests = 0
  const server = createServer((request, response) => {
    if (request.url === '/runtime/global.min.js') response.writeHead(200, { 'content-type': 'text/javascript' }).end(script)
    else if (request.url === '/runtime/default-program.bin') {
      programRequests++; response.writeHead(200, { 'content-type': 'application/octet-stream' }).end(program)
    } else if (request.url === '/') response.writeHead(200, { 'content-type': 'text/html' })
      .end('<!doctype html><html hidden><head><script src="/runtime/global.min.js"></script></head><body><span id="probe" class="block">Candidate runtime</span></body></html>')
    else response.writeHead(404).end()
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  let browser
  try {
    const { chromium } = await import('@playwright/test')
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`http://127.0.0.1:${server.address().port}/`)
    await page.waitForFunction(() => globalThis.masterCSSRuntime?.snapshot().engine === 'ready'
      && !document.documentElement.hasAttribute('hidden') && getComputedStyle(document.querySelector('#probe')).display === 'block')
    await page.locator('#probe').evaluate(element => { element.className = 'hidden' })
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')).display === 'none')
    assert.deepEqual(errors, []); assert.equal(programRequests, 1)
    return { browser: 'chromium', startup: true, domMutation: true, scriptIntegrity: hash(script), programIntegrity: hash(program) }
  } finally {
    await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve))
  }
}

export async function consumeArchives({ directory, cohort, manager, smoke = true, artifacts }) {
  assert.ok(['npm', 'bun', 'pnpm'].includes(manager))
  const temporary = await realpath(await mkdtemp(join(tmpdir(), `master-archive-${manager}-`))), cwd = join(temporary, 'consumer')
  const registry = await candidateRegistry(directory, cohort)
  let cleanupSafe = true
  try {
    await mkdir(cwd); const cache = join(temporary, 'cache'); await mkdir(cache)
    const env = registryConsumerEnvironment(process.env, cache)
    await writeFile(env.NPM_CONFIG_USERCONFIG, ''); await writeFile(env.NPM_CONFIG_GLOBALCONFIG, '')
    // Dedicated stores and configuration are disposable; no project/global manager changes.
    await writeFile(join(cwd, '.npmrc'), `registry=https://registry.npmjs.org/\n@master:registry=${registry.origin}/\nignore-scripts=true\n`)
    const host = `${process.platform}-${process.arch}${process.platform === 'linux' ? (process.report.getReport().header.glibcVersionRuntime ? '-gnu' : '-musl') : ''}`
    const names = cohort.packages.filter(pkg => !nativePattern.test(pkg.name)
      || pkg.name.includes(host)).map(pkg => pkg.name)
    const dependencies = Object.fromEntries(names.map(name => [name, cohort.version]))
    // Publish-time peers are explicit roots so each manager exercises the same supported host inputs.
    for (const pkg of registry.packages.values()) for (const [name, version] of Object.entries(pkg.manifest.peerDependencies ?? {})) {
      if (!name.startsWith('@master/') && !pkg.manifest.peerDependenciesMeta?.[name]?.optional) dependencies[name] ??= version
    }
    if (smoke && manager === 'npm') for (const framework of ['astro', 'svelte']) {
      const example = await json(join(sourceRoot, 'examples', framework, 'package.json'))
      for (const [name, version] of Object.entries({ ...example.dependencies, ...example.devDependencies })) {
        if (!name.startsWith('@master/')) dependencies[name] = version
      }
    }
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies }))
    const options = { cwd, env, extendEnv: false, preferLocal: false, timeout: 600_000, maxBuffer: 32 * 1024 * 1024 }
    const args = manager === 'npm' ? ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--legacy-peer-deps']
      : manager === 'bun' ? ['install', '--ignore-scripts', '--no-progress', '--cache-dir', cache]
        : ['install', '--ignore-scripts', '--store-dir', join(temporary, 'store'), '--config.auto-install-peers=false', '--config.strict-peer-dependencies=false']
    const version = (await execa(manager, ['--version'], options)).stdout.trim()
    await execa(manager, args, options)
    const lock = await parseLock(manager, cwd, options)
    const installed = verifyCandidateLock(manager, lock, cohort, registry.origin, names)
    for (const name of names) {
      const location = await realpath(join(cwd, 'node_modules', name))
      assert.ok(!relative(cwd, location).startsWith('..'), `Candidate links outside isolated consumer: ${name}`)
      const actual = await json(join(location, 'package.json'))
      assert.equal(actual.name, name); assert.equal(actual.version, cohort.version)
      assert.equal(actual.gitHead, cohort.revision, `Wrong candidate source: ${name}`)
    }
    assert.deepEqual(registry.failures, [], 'Registry rejected an unknown Master dependency')
    let result
    let frameworkBuilds
    let browserRuntime
    if (smoke) {
      await writeFile(join(cwd, 'smoke.mjs'), archiveSmokeSource)
      const output = await execa(process.execPath, ['smoke.mjs'], { ...options, timeout: 120_000 })
      result = output.stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
      assert.equal(result.at(-1).mcpStdioRender, true)
      if (manager === 'npm') {
        frameworkBuilds = await buildFrameworkFixtures(cwd, cohort, options, artifacts)
        browserRuntime = await browserRuntimeSmoke(cwd)
      }
    }
    return { manager, managerVersion: version, installed: names, locked: installed, required: names, smoke: result, frameworkBuilds, browserRuntime,
      requests: registry.requests, noPublishedMasterFallback: true, isolatedCache: true }
  } catch (error) {
    if (error.stderr?.includes('CHILD_EXIT_UNCONFIRMED')) cleanupSafe = false
    throw error
  } finally {
    await registry.close()
    if (cleanupSafe) await rm(temporary, { recursive: true, force: true })
    else process.stderr.write(`Retained consumer because child exit is unconfirmed: ${temporary}\n`)
  }
}

export async function rehearseArchives({ input, proof, managers = ['npm', 'bun', 'pnpm'] }) {
  assert.equal(process.versions.node.split('.')[0], '24')
  const cohort = await json(join(input, 'cohort.json')), results = []
  const report = { schemaVersion: 1, mode: 'assembled-archive-rehearsal', publicRegistryEvidence: false,
    checkedAt: new Date().toISOString(), revision: cohort.revision, version: cohort.version,
    completeArchiveCohort: cohort.complete, publicPackageCount: cohort.publicPackageCount,
    archiveCount: cohort.packages.length, missingNativeTargets: cohort.missingNativeTargets,
    dirtySource: cohort.dirtySource, nativeArtifactRevision: cohort.nativeArtifactRevision,
    platform: process.platform, arch: process.arch,
    packages: cohort.packages.map(({ manifest, ...pkg }) => pkg), results, managers, verificationComplete: false }
  const save = () => writeFile(proof, JSON.stringify(report, null, 2) + '\n')
  await mkdir(dirname(proof), { recursive: true }); await save()
  for (const manager of managers) {
    try {
      results.push({ status: 'passed', ...await consumeArchives({ directory: join(input, cohort.archives), cohort, manager,
        artifacts: join(dirname(proof), 'framework-evidence') }) })
      await save()
    } catch (error) {
      results.push({ manager, status: 'failed', error: error.message.split('\n')[0] }); await save(); throw error
    }
  }
  report.verificationComplete = true; await save()
  return report
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, ...args] = process.argv.slice(2)
  const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined
  const root = resolve(option('--root') ?? sourceRoot)
  let result
  if (command === 'prepare') {
    assert.ok(option('--output') && option('--version'), 'Pass --output and --version')
    result = await prepareArchives({ root, output: resolve(option('--output')), version: option('--version'), hostOnly: args.includes('--host-only'), nativeRevision: option('--native-revision') })
  } else if (command === 'consume') {
    assert.ok(option('--input') && option('--proof'), 'Pass --input and --proof')
    result = await rehearseArchives({ input: resolve(option('--input')), proof: resolve(option('--proof')),
      managers: option('--managers')?.split(',') ?? ['npm', 'bun', 'pnpm'] })
  } else throw new Error('Use prepare or consume; these commands never publish or promote packages')
  console.log(JSON.stringify(result, null, 2))
}
