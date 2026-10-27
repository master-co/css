// node scripts/benchmark-native-hosts.mjs BEFORE_ROOT AFTER_ROOT OUTPUT.json
// Build both revisions first. Browser and Next results are paired on one machine.
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join, resolve, extname } from 'node:path'
import { tmpdir, platform } from 'node:os'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const [beforeRoot, afterRoot, output, worker] = process.argv.slice(2)
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const library = root => resolve(root, 'target/release', platform() === 'darwin' ? 'libmastercss_binding_native.dylib' : 'libmastercss_binding_native.so')
if (worker === 'next') {
  const { prepareNextStatic, scanStaticModule } = await import(pathToFileURL(resolve(beforeRoot, 'packages/next/dist/static.js')).href)
  const root = await mkdtemp(join(tmpdir(), 'master-paired-next-'))
  const samples = { cold: [], unchanged: [], edited: [] }
  try {
    await mkdir(join(root, 'src'))
    await writeFile(join(root, 'app.css'), '@master entry;')
    for (let index = 0; index < 100; index++) await writeFile(join(root, `src/page-${index}.tsx`), `<div className="p:${index}px flex"/>`)
    for (let round = 0; round < 15; round++) {
      for (const session of globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__?.values() ?? []) { await session.scanner.dispose(); session.stylesheets.dispose() }
      globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__ = new Map()
      let start = performance.now()
      const state = await prepareNextStatic({}, { projectDir: root })
      if (round >= 5) samples.cold.push(performance.now() - start)
      const file = join(root, 'src/page-0.tsx')
      start = performance.now()
      await scanStaticModule(state.statePath, file, readFileSync(file, 'utf8'))
      if (round >= 5) samples.unchanged.push(performance.now() - start)
      const content = `<div className="p:${round + 101}px flex"/>`
      await writeFile(file, content)
      start = performance.now()
      await scanStaticModule(state.statePath, file, content)
      if (round >= 5) samples.edited.push(performance.now() - start)
    }
    console.log(JSON.stringify({ samples, mediansMs: Object.fromEntries(Object.entries(samples).map(([key, value]) => [key, median(value)])) }))
  } finally {
    for (const session of globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__?.values() ?? []) { await session.scanner.dispose(); session.stylesheets.dispose() }
    await rm(root, { recursive: true, force: true })
  }
  process.exit(0)
}
if (!output) throw new Error('Expected BEFORE_ROOT AFTER_ROOT OUTPUT.json')
const roots = [resolve(beforeRoot), resolve(afterRoot)]
const pages = roots.map(root => {
  const module = { exports: {} }; process.dlopen(module, library(root))
  const manifest = readFileSync(join(root, 'packages/preset/src/default-manifest.json'), 'utf8')
  const renderer = new module.exports.RenderSession(manifest)
  const classes = Array.from({ length: 120 }, (_, index) => `p:${index + 1}px`)
  renderer.ensureClasses(classes)
  const result = JSON.parse(renderer.snapshot()); renderer.dispose()
  const body = classes.map((name, index) => `<div id="probe-${index}" class="${name}">Probe</div>`).join('')
  const hydrate = `<style id="master-css">${result.snapshot.text}</style><script type="application/json" id="master-css-hydration-manifest">${JSON.stringify(result.hydrationManifest)}</script>`
  return { body, hydrate }
})
const requests = []
const server = createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost'), [side, ...path] = url.pathname.slice(1).split('/'), index = Number(side)
    if (!roots[index]) throw new Error('Invalid side')
    let bytes, type
    if (path[0] === 'page') {
      bytes = Buffer.from(`<!doctype html><html><head><style>@layer theme,base,defaults,components,utilities;</style>${url.searchParams.has('hydration') ? pages[index].hydrate : ''}</head><body>${pages[index].body}<script>globalThis.startedAt=performance.now()</script><script src="/${index}/dist/global.min.js"></script></body></html>`)
      type = 'text/html'
    } else {
      const file = resolve(roots[index], 'packages/runtime', path.join('/'))
      if (!file.startsWith(join(roots[index], 'packages/runtime') + '/')) throw new Error('Invalid asset')
      bytes = readFileSync(file)
      type = { '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm' }[extname(file)]
    }
    requests.push({ path: url.pathname, bytes: bytes.length })
    res.setHeader('Content-Type', type ?? 'application/octet-stream'); res.setHeader('Cache-Control', 'no-store'); res.end(bytes)
  } catch (error) { res.statusCode = 404; res.end(String(error)) }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = await chromium.launch()
const samples = [{ runtime: [], hydration: [], mutation: [], styledFrame: [] }, { runtime: [], hydration: [], mutation: [], styledFrame: [] }]
try {
  for (let round = 0; round < 20; round++) for (const index of round % 2 ? [1, 0] : [0, 1]) for (const hydration of [false, true]) {
    const page = await browser.newPage()
    const errors = []; page.on('pageerror', error => errors.push(String(error)))
    await page.goto(`http://127.0.0.1:${server.address().port}/${index}/page${hydration ? '?hydration' : ''}`)
    await page.waitForFunction(() => globalThis.masterCSSRuntime && getComputedStyle(document.getElementById('probe-0')).padding === '1px')
    const result = await page.evaluate(async () => {
      const startup = performance.now() - globalThis.startedAt
      await new Promise(requestAnimationFrame)
      const styledFrame = performance.now() - globalThis.startedAt
      const element = document.getElementById('probe-0'), start = performance.now()
      element.className = 'p:241px'
      while (getComputedStyle(element).padding !== '241px') await new Promise(resolve => setTimeout(resolve, 0))
      return { startup, styledFrame, mutation: performance.now() - start }
    })
    if (errors.length) throw new Error(errors.join('\n'))
    if (round >= 5) {
      samples[index][hydration ? 'hydration' : 'runtime'].push(result.startup)
      samples[index].mutation.push(result.mutation)
      samples[index].styledFrame.push(result.styledFrame)
    }
    await page.close()
  }
} finally { await browser.close(); server.close() }
const next = []
for (const root of roots) next.push(await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [import.meta.filename, root, root, output, 'next'], {
    cwd: root,
    env: { ...process.env, MASTER_CSS_NATIVE_BINDING_PATH: library(root) }, stdio: ['ignore', 'pipe', 'pipe']
  })
  let stdout = '', stderr = ''
  child.stdout.on('data', value => { stdout += value }); child.stderr.on('data', value => { stderr += value })
  child.on('error', reject); child.on('exit', code => code === 0 ? resolve(JSON.parse(stdout.trim().split('\n').at(-1))) : reject(new Error(stderr)))
}))
const result = { version: 1, node: process.version, browserVersion: browser.version(), browserRounds: 20, warmup: 5,
  notes: ['Local HTTP; no network throttling. Startup includes script/manifest/Wasm delivery and browser scheduling.', 'Styled frame is the first sampled frame after runtime readiness, not a laboratory FCP measurement.', 'Next uses 100 TSX sources and release native bindings; the new implementation reconciles a full snapshot.'],
  browser: samples.map(samples => ({ samples, mediansMs: Object.fromEntries(Object.entries(samples).map(([name, values]) => [name, median(values)])) })),
  requests: [...new Map(requests.map(request => [request.path, request])).values()], next }
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ browser: result.browser.map(result => result.mediansMs), next: result.next.map(result => result.mediansMs) }))
