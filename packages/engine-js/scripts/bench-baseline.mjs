// Browser baseline: the current runtime, which inlines the JS engine, against the rc.87
// pure JS runtime and a Wasm-engine runtime build, on the DOM scenarios of
// `bun run --filter @master/css-runtime bench` that they share. Readiness is checked
// through computed styles, so no runtime's API is assumed.
//
//   node packages/engine-js/scripts/bench-baseline.mjs [--rc87 <rc.87 dist>] [--wasm <package dir>] [--out file.json]
//
// `--wasm` takes a runtime package built with the Wasm engine: its `dist/` and the
// `artifacts/` Wasm beside it.
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const { chromium, webkit } = createRequire(join(root, 'packages/runtime/package.json'))('@playwright/test')
const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index].replace(/^--/, ''), process.argv[index + 1])
const rounds = Number(args.get('rounds') ?? process.env.MASTER_CSS_BENCH_ROUNDS ?? 7)
const warmupRounds = Number(args.get('warmup') ?? 2)
const scanClassCount = Number(args.get('scan') ?? 1000)
const browserName = args.get('browser') ?? 'chromium'
const outputFile = args.get('out')

const targets = {
  js: {
    files: {
      'global.min.js': join(root, 'packages/runtime/dist/global.min.js'),
      'default-program.bin': join(root, 'packages/runtime/dist/default-program.bin')
    },
    preload: 'default-program.bin'
  }
}
if (args.has('rc87')) {
  const dist = resolve(args.get('rc87'))
  targets.rc87 = {
    files: { 'global.min.js': join(dist, 'global.min.js'), 'default-manifest.json': join(dist, 'default-manifest.json') },
    preload: 'default-manifest.json'
  }
}
if (args.has('wasm')) {
  const packageDir = resolve(args.get('wasm'))
  targets.wasm = {
    files: {
      'global.min.js': join(packageDir, 'dist/global.min.js'),
      'default-program.bin': join(packageDir, 'dist/default-program.bin'),
      'artifacts/mastercss_binding_wasm_engine_bg.wasm': join(packageDir, 'artifacts/mastercss_binding_wasm_engine_bg.wasm')
    },
    preload: 'default-program.bin'
  }
}
if (Object.keys(targets).length < 2) throw new Error('Pass --rc87 or --wasm to compare against.')
for (const target of Object.values(targets)) {
  for (const file of Object.values(target.files)) if (!existsSync(file)) throw new Error(`Missing ${file}`)
}

const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream', '.wasm': 'application/wasm' }
const utilityKeys = ['width', 'height', 'min-width', 'max-width', 'margin', 'padding', 'top', 'right', 'bottom', 'left']
const classNames = (count) => Array.from({ length: count }, (_, index) => `${utilityKeys[index % utilityKeys.length]}:${index + 1}px`)
// The sentinel is last in document order, so its style proves the whole scan finished.
const markup = (classes) => classes.map((className) => `<div class="${className}"></div>`).join('') + '<i id="sentinel" class="width:12345px"></i>'

const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1')
  const [, name, ...rest] = url.pathname.split('/')
  const target = targets[name]
  if (target && !rest.length) {
    response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' })
    response.end(`<!doctype html><html><head><meta charset="utf-8">${url.searchParams.has('preload') ? `<link rel="preload" as="fetch" crossorigin href="/${name}/${target.preload}">` : ''}</head><body></body></html>`)
    return
  }
  // The Wasm global bundle loads `../artifacts/…` relative to its script.
  const file = name === 'artifacts' ? targets.wasm?.files[url.pathname.slice(1)] : target?.files[rest.join('/')]
  if (!file) {
    response.writeHead(404)
    response.end()
    return
  }
  response.writeHead(200, { 'content-type': MIME[extname(file)], 'cache-control': 'no-store', 'access-control-allow-origin': '*' })
  response.end(await readFile(file))
})
await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen))
const baseURL = `http://127.0.0.1:${server.address().port}`

async function open(browser, name, { preload = false, body = '' } = {}) {
  const page = await browser.newPage()
  if (process.env.BENCH_DEBUG) page.on('response', (r) => process.stderr.write(`${r.status()} ${r.url()}\n`)), page.on('pageerror', (e) => process.stderr.write(`pageerror ${e}\n`))
  await page.goto(`${baseURL}/${name}${preload ? '?preload' : ''}`)
  if (body) await page.evaluate((html) => { document.body.innerHTML = html }, body)
  return page
}

/** Inserts the script and resolves once `probe` has its style, or the runtime observes an empty DOM. */
function loadRuntime(page, name) {
  return page.evaluate(async (src) => {
    const startedAt = performance.now()
    const probe = document.getElementById('sentinel')
    const script = document.createElement('script')
    script.src = src
    document.head.append(script)
    const ready = () => probe
      ? getComputedStyle(probe).width === '12345px'
      : globalThis.masterCSSRuntime?.observing === true || globalThis.masterCSSRuntime?.snapshot?.().observing === true
    while (!ready()) {
      if (performance.now() - startedAt > 15_000) throw new Error(`Timed out waiting for the runtime: ${JSON.stringify({ type: typeof globalThis.masterCSSRuntime, observing: globalThis.masterCSSRuntime?.observing, snapshot: globalThis.masterCSSRuntime?.snapshot?.().engine, keys: Object.keys(globalThis.masterCSSRuntime?.snapshot?.() ?? {}) })}`)
      await new Promise((resolveFrame) => requestAnimationFrame(resolveFrame))
    }
    return performance.now() - startedAt
  }, `/${name}/global.min.js`)
}

const scenarios = {
  'empty DOM startup (preload)': async (browser, name) => {
    const page = await open(browser, name, { preload: true })
    try { return await loadRuntime(page, name) } finally { await page.close() }
  },
  [`initial DOM scan ${scanClassCount} classes (no preload)`]: async (browser, name) => {
    const page = await open(browser, name, { body: markup(classNames(scanClassCount)) })
    try { return await loadRuntime(page, name) } finally { await page.close() }
  },
  [`initial DOM scan ${scanClassCount} classes (preload)`]: async (browser, name) => {
    const page = await open(browser, name, { preload: true, body: markup(classNames(scanClassCount)) })
    try { return await loadRuntime(page, name) } finally { await page.close() }
  },
  [`mutation add+remove ${scanClassCount} classes`]: async (browser, name) => {
    const page = await open(browser, name, { preload: true })
    try {
      await loadRuntime(page, name)
      return await page.evaluate(async (html) => {
        const container = document.createElement('section')
        container.innerHTML = html
        const probe = container.querySelector('#sentinel')
        const startedAt = performance.now()
        document.body.append(container)
        while (getComputedStyle(probe).width !== '12345px') {
          if (performance.now() - startedAt > 15_000) throw new Error('Timed out waiting for mutation styles.')
          await new Promise((resolveTask) => setTimeout(resolveTask, 0))
        }
        container.remove()
        await new Promise((resolveTask) => setTimeout(resolveTask, 0))
        return performance.now() - startedAt
      }, markup(classNames(scanClassCount)))
    } finally { await page.close() }
  }
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return {
    median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    min: sorted[0],
    p90: sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.9) - 1)],
    samples
  }
}

async function sizes(target) {
  const entries = {}
  for (const [file, path] of Object.entries(target.files)) {
    const source = await readFile(path)
    entries[file] = { raw: source.byteLength, brotli: brotliCompressSync(source).byteLength }
  }
  return entries
}

const browser = await { chromium, webkit }[browserName].launch()
const results = {}
try {
  for (const [scenario, run] of Object.entries(scenarios)) {
    results[scenario] = {}
    for (const name of Object.keys(targets)) {
      const samples = []
      // Alternate warmup and measurement per target so both see the same machine state.
      for (let index = 0; index < warmupRounds + rounds; index++) {
        const value = await run(browser, name)
        if (index >= warmupRounds) samples.push(value)
      }
      results[scenario][name] = summarize(samples)
    }
  }
} finally {
  await browser.close()
  server.close()
}

const report = {
  generatedAt: new Date().toISOString(),
  browser: `${browserName} ${browser.version()}`,
  rounds,
  warmupRounds,
  scanClassCount,
  sizes: Object.fromEntries(await Promise.all(Object.entries(targets).map(async ([name, target]) => [name, await sizes(target)]))),
  results
}
for (const [scenario, byTarget] of Object.entries(results)) {
  const columns = Object.entries(byTarget).map(([name, { median }]) => `${name} ${median.toFixed(2).padStart(8)} ms`)
  process.stdout.write(`${scenario.padEnd(46)} ${columns.join('   ')}\n`)
}
if (outputFile) {
  await mkdir(dirname(outputFile), { recursive: true })
  await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`)
}
