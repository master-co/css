import { fork, execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const filename = fileURLToPath(import.meta.url)
const root = fileURLToPath(new URL('..', import.meta.url))
const execute = promisify(execFile)
const args = process.argv.slice(2)
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
const mib = value => Math.round(value / 1048576 * 10) / 10
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

function graphs(server) {
  return Object.fromEntries(Object.entries(server.environments).map(([name, environment]) => {
    const modules = [...(environment.moduleGraph?.idToModuleMap.values() ?? [])]
    const files = [...new Set(modules.map(module => module.file).filter(Boolean))].sort()
    // Glob imports register graph nodes before loading them. Count pages only once
    // Vite has actually transformed the module, not merely referenced its filename.
    const loadedFiles = [...new Set(modules.filter(module => module.transformResult || module.ssrTransformResult).map(module => module.file).filter(Boolean))].sort()
    return [name, {
      modules: modules.length,
      files: files.length,
      pages: loadedFiles.filter(file => file.startsWith(path.join(root, 'content/')) && file.endsWith('/page.tsx')).map(file => path.relative(root, file)),
      mdx: loadedFiles.filter(file => file.endsWith('.mdx')).map(file => path.relative(root, file)),
      largeData: files.filter(file => file.endsWith('/.generated/reference.json') || /\/benchmarks\/[^/]+\/(?:snapshot|long-session-evidence)\.json$/.test(file)),
      transformedMiB: mib(modules.reduce((total, module) => total + Buffer.byteLength((module.transformResult ?? module.ssrTransformResult)?.code ?? ''), 0))
    }]
  }))
}

async function browser(base) {
  const { chromium } = await import('@playwright/test')
  const instance = await chromium.launch({ headless: true })
  const errors = []
  try {
    const page = await instance.newPage()
    page.on('pageerror', error => errors.push(error.message))
    for (const route of ['/', '/guide/view-transitions', '/reference/grid-columns', '/reference/rules/declarations', '/reference/tokens/color', '/tw/guide/view-transitions', '/design-system/review/package-api', '/guide/benchmarks']) {
      const response = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 })
      if (response.status() !== 200) throw new Error(`${route}: HTTP ${response.status()}`)
      await page.waitForFunction(() => [...document.querySelectorAll('site-island')].filter(island => {
        const rect = island.getBoundingClientRect()
        return rect.top < innerHeight && rect.bottom > 0
      }).every(island => island.siteIslandHydrated), null, { timeout: 15000 })
      const styled = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-surface-base').trim())
      if (!styled) throw new Error(`${route}: missing site theme styles`)
      if (route === '/') {
        if (await page.locator('.home-page').evaluate(element => getComputedStyle(element).overflow) !== 'hidden') throw new Error('Homepage utility CSS is missing')
        await page.waitForFunction(() => document.querySelector('site-island[data-island$="search.tsx#default"]')?.siteIslandHydrated)
        await page.keyboard.press('Meta+k')
        await page.getByRole('dialog', { name: 'Search documentation' }).waitFor()
        await page.getByRole('searchbox').fill('padding')
        await page.locator('#documentation-search-results a').first().waitFor()
        await page.keyboard.press('Escape')
      }
      if (route === '/design-system/review/package-api') {
        const disclosure = page.locator('details').filter({ has: page.locator('.doc-declaration') }).first()
        await disclosure.locator('summary').click()
        if (await disclosure.getAttribute('open') === null || !(await disclosure.textContent()).includes('MasterCSSInspectionReport')) throw new Error('Package declaration disclosure is incomplete')
      }
    }
    if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`)
  } finally { await instance.close() }
}

async function worker() {
  const { dev } = await import('astro')
  const temporary = await mkdtemp(path.join(tmpdir(), 'master-css-dev-memory-'))
  let vite
  const samples = []
  const requests = []
  const server = await dev({
    root,
    cacheDir: path.join(temporary, 'astro'),
    server: { host: '127.0.0.1', port: 0, open: false },
    vite: { cacheDir: path.join(temporary, 'vite'), plugins: [{ name: 'site:memory-profile', configureServer(server) { vite = server } }] }
  })
  const base = `http://127.0.0.1:${server.address.port}`
  async function sample(stage) {
    global.gc()
    await pause(100)
    global.gc()
    const memoryMiB = Object.fromEntries(Object.entries(process.memoryUsage()).map(([name, value]) => [name, mib(value)]))
    let physicalFootprint
    if (process.platform === 'darwin') {
      const { stdout } = await execute('vmmap', ['-summary', String(process.pid)])
      physicalFootprint = stdout.match(/^Physical footprint:\s+(.+)$/m)?.[1].trim()
    }
    const result = { stage, memoryMiB, physicalFootprint, graphs: graphs(vite) }
    samples.push(result)
    process.send?.({ progress: { stage, memoryMiB, serverModules: result.graphs.ssr?.modules } })
    return result
  }
  async function visit(route, status = 200) {
    const start = performance.now()
    const response = await fetch(base + route)
    const html = await response.text()
    const result = { route, status: response.status, milliseconds: Math.round(performance.now() - start), bytes: Buffer.byteLength(html) }
    requests.push(result)
    if (result.status !== status) throw new Error(`${route}: expected ${status}, received ${result.status}`)
  }
  try {
    await sample('ready')
    await visit('/')
    const first = await sample('first-home')
    if (args.includes('--assert-lazy')) {
      if (first.graphs.ssr.pages.some(file => file !== 'content/page.tsx') || first.graphs.ssr.mdx.length) throw new Error(`Home loaded unrelated page or MDX modules: ${JSON.stringify({ pages: first.graphs.ssr.pages, mdx: first.graphs.ssr.mdx })}`)
      if (first.graphs.ssr.largeData.some(file => !file.includes('/docs-page-css-size/'))) throw new Error('Home loaded unrelated large data')
    }
    for (let batch = 1; batch <= 3; batch++) {
      for (let index = 0; index < 10; index++) await visit('/')
      await sample(`home-repeat-${batch * 10}`)
    }
    for (let batch = 1; batch <= 2; batch++) {
      for (let index = 0; index < 10; index++) await visit('/guide/view-transitions')
      await sample(`guide-repeat-${batch * 10}`)
    }
    // Exercise Vite's real watcher invalidation without editing the user's files.
    for (let batch = 1; batch <= 2; batch++) {
      for (let index = 0; index < 10; index++) {
        vite.watcher.emit('change', path.join(root, 'content/components/HeroSection.tsx'))
        await pause(150)
        await visit('/')
      }
      await sample(`hot-invalidation-${batch * 10}`)
    }
    const routes = await (await vite.environments.ssr.runner.import(path.join(root, 'routes.ts'))).getStaticPaths()
    if (!args.includes('--http-only')) await execute(process.execPath, [filename, '--browser', base], { cwd: root, maxBuffer: 1048576 })
    await visit('/__memory-audit-missing-page', 404)
    await sample('after-browsing')
    return { versions: { node: process.version, astro: JSON.parse(await readFile(new URL('../node_modules/astro/package.json', import.meta.url))).version }, samples, requests, routes }
  } finally {
    await server.stop()
    await rm(temporary, { recursive: true, force: true })
  }
}

async function main() {
  const count = Number(option('--runs', '3'))
  if (!Number.isInteger(count) || count < 1) throw new Error('--runs must be a positive integer')
  const runs = []
  for (let index = 0; index < count; index++) {
    const result = await new Promise((resolve, reject) => {
      const child = fork(filename, ['--worker', ...args], { cwd: root, execArgv: ['--expose-gc'], env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
      let log = ''
      let result
      for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { log = (log + data).slice(-16000) })
      child.on('message', message => {
        if (message.progress) console.log(JSON.stringify({ run: index + 1, ...message.progress }))
        else result = message.result
      })
      child.once('error', reject)
      child.once('close', code => code === 0 && result ? resolve(result) : reject(new Error(`Measurement failed (${code})\n${log}`)))
    })
    runs.push(result)
  }
  const median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
  const summary = {
    runs: count,
    firstHomeHeapMiB: median(runs.map(run => run.samples.find(sample => sample.stage === 'first-home').memoryMiB.heapUsed)),
    firstHomeRSSMiB: median(runs.map(run => run.samples.find(sample => sample.stage === 'first-home').memoryMiB.rss)),
    firstHomeMilliseconds: median(runs.map(run => run.requests[0].milliseconds)),
    firstHomeServerModules: median(runs.map(run => run.samples.find(sample => sample.stage === 'first-home').graphs.ssr.modules))
  }
  const output = option('--output')
  if (output) {
    await mkdir(path.dirname(path.resolve(output)), { recursive: true })
    await writeFile(output, JSON.stringify({ summary, runs }, null, 2) + '\n')
  }
  console.log(JSON.stringify({ summary }))
}

try {
  if (args.includes('--browser')) await browser(option('--browser'))
  else if (args.includes('--worker')) {
    const result = await worker()
    await new Promise((resolve, reject) => process.send({ result }, error => error ? reject(error) : resolve()))
    process.disconnect()
  }
  else await main()
} catch (error) { console.error(error); process.exitCode = 1 }
