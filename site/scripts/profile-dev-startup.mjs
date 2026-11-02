import { fork, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const site = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const args = process.argv.slice(2)
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

async function worker() {
  const { dev } = await import('astro')
  const temporary = await mkdtemp(path.join(tmpdir(), 'master-css-startup-'))
  const updates = [], loads = [], errors = []
  let vite, browser, server
  const start = performance.now()
  try {
    server = await dev({
      root: site, logLevel: 'silent', cacheDir: path.join(temporary, 'astro'),
      server: { host: '127.0.0.1', port: 0, open: false },
      vite: { cacheDir: path.join(temporary, 'vite'), plugins: [{
        name: 'site:startup-profile',
        configureServer(value) {
          vite = value
          for (const [name, environment] of Object.entries(vite.environments)) {
            const reload = environment.reloadModule.bind(environment)
            environment.reloadModule = async module => {
              if (module.id?.includes('master-css-emitted-globals')) updates.push({ environment: name })
              return reload(module)
            }
            const load = environment.pluginContainer.load.bind(environment.pluginContainer)
            environment.pluginContainer.load = async (...input) => {
              const at = performance.now()
              const result = await load(...input)
              if (input[0].includes('master-css-emitted-globals')) {
                const code = typeof result === 'string' ? result : result?.code ?? ''
                loads.push({ environment: name, ms: performance.now() - at, hash: createHash('sha256').update(code).digest('hex') })
              }
              return result
            }
          }
        }
      }] }
    })
    const readyMs = performance.now() - start
    const { chromium } = await import('@playwright/test')
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    page.on('pageerror', error => errors.push(error.message))
    const base = `http://127.0.0.1:${server.address.port}`
    const at = performance.now()
    const response = await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 })
    if (response.status() !== 200) throw new Error(`Homepage: HTTP ${response.status()}`)
    await page.waitForFunction(() => {
      const islands = [...document.querySelectorAll('astro-island')]
      return islands.length && islands.filter(element => {
        const rect = element.getBoundingClientRect()
        return rect.top < innerHeight && rect.bottom > 0
      }).every(element => !element.hasAttribute('ssr'))
    }, null, { timeout: 20000 })
    const islandPreparationMs = performance.now() - at
    const timing = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      return { firstHomeMilliseconds: navigation.responseStart - navigation.requestStart, responseEndMs: navigation.responseEnd }
    })
    if (!await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-surface-base').trim())) throw new Error('Missing theme styles')
    // Astro drops `ssr` once an island hydrates, before its effects settle. Probe
    // the same idempotent open event as its button, then require usable results.
    await page.waitForFunction(() => {
      if (document.querySelector('dialog.documentation-search')?.open) return true
      window.dispatchEvent(new CustomEvent('site-search:open'))
      return false
    }, null, { timeout: 20000 })
    await page.getByRole('combobox', { name: /Search documentation|搜尋文件/ }).fill('padding')
    await page.locator('#documentation-search-results a').first().waitFor()
    const interactiveMs = performance.now() - at
    await page.keyboard.press('Escape')
    const updatesAtReady = updates.length
    await pause(1000)
    const idleUpdates = updates.length - updatesAtReady
    const warm = []
    for (let index = 0; index < 5; index++) {
      const before = performance.now()
      const warmResponse = await fetch(base)
      await warmResponse.text()
      if (warmResponse.status !== 200) throw new Error(`Warm homepage: HTTP ${warmResponse.status}`)
      warm.push(performance.now() - before)
    }
    const loaded = [...vite.environments.ssr.moduleGraph.idToModuleMap.values()].filter(module => module.transformResult)
    const pages = [...new Set(loaded.filter(module => module.file?.startsWith(path.join(site, 'content/')) && module.file.endsWith('/page.astro')).map(module => path.relative(site, module.file)))]
    const mdx = loaded.filter(module => module.file?.endsWith('.mdx')).length
    if (pages.some(file => file !== 'content/page.astro') || mdx) throw new Error(`Homepage loaded unrelated routes: ${JSON.stringify({ pages, mdx })}`)
    global.gc?.()
    const memory = process.memoryUsage()
    // Exercise browser behavior after recording the cold-start graph and times.
    await page.waitForFunction(() => document.querySelector('astro-island[component-url*="SearchDialog"]:not([ssr])'))
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k')
    await page.getByRole('dialog', { name: 'Search documentation' }).waitFor()
    await page.getByRole('combobox', { name: /Search documentation|搜尋文件/ }).fill('padding')
    await page.locator('#documentation-search-results a').first().waitFor()
    await page.keyboard.press('Escape')
    const homeUpdates = updates.length, homeLoads = loads.length
    const homeLoadMs = loads.reduce((sum, load) => sum + load.ms, 0)
    const uniqueGlobals = new Set(loads.map(load => `${load.environment}:${load.hash}`)).size
    for (const route of ['/guide/introduction', '/reference/grid-columns', '/']) {
      const next = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 })
      if (next.status() !== 200) throw new Error(`${route}: HTTP ${next.status()}`)
      await page.waitForFunction(() => [...document.querySelectorAll('astro-island')].filter(element => {
        const rect = element.getBoundingClientRect()
        return rect.top < innerHeight && rect.bottom > 0
      }).every(element => !element.hasAttribute('ssr')))
      if (!await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-surface-base').trim())) throw new Error(`${route}: missing theme styles`)
    }
    if (errors.length) throw new Error(errors.join('\n'))
    return {
      readyMs, ...timing, islandPreparationMs, interactiveMs, warmMedianMs: median(warm),
      idleUpdates, emittedGlobalsUpdates: homeUpdates, emittedGlobalsLoads: homeLoads,
      emittedGlobalsLoadMs: homeLoadMs, uniqueGlobals,
      pages, mdx, heapMiB: memory.heapUsed / 1048576, rssMiB: memory.rss / 1048576,
      node: process.version
    }
  } finally {
    await browser?.close()
    await server?.stop()
    await rm(temporary, { recursive: true, force: true })
  }
}

if (args.includes('--worker')) {
  try { process.send({ result: await worker() }) } catch (error) { console.error(error); process.exitCode = 1 }
  process.disconnect()
} else {
  const count = Number(option('--runs', '3'))
  if (!Number.isInteger(count) || count < 1) throw new Error('--runs must be a positive integer')
  const at = performance.now()
  const prepare = spawnSync('bun', ['run', '--filter', 'site', 'prepare-app'], { cwd: path.dirname(site), stdio: 'pipe' })
  if (prepare.status !== 0) throw new Error(String(prepare.stderr))
  const prepareMs = performance.now() - at
  const runs = []
  for (let index = 0; index < count; index++) {
    const result = await new Promise((resolve, reject) => {
      // Match the workspace dev script's runtime cwd for generated document IO.
      const child = fork(filename, ['--worker'], { cwd: site, execArgv: ['--expose-gc'], env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
      let value, log = ''
      for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { log = (log + data).slice(-12000) })
      child.on('message', message => { value = message.result })
      child.once('error', reject)
      child.once('close', code => code === 0 && value ? resolve(value) : reject(new Error(`Startup profile failed (${code})\n${log}`)))
    })
    runs.push(result)
    console.log(JSON.stringify({ run: index + 1, ...result }))
  }
  const summary = Object.fromEntries(['readyMs', 'firstHomeMilliseconds', 'interactiveMs', 'warmMedianMs', 'emittedGlobalsUpdates', 'emittedGlobalsLoads', 'heapMiB', 'rssMiB'].map(key => [key, median(runs.map(run => run[key]))]))
  const output = option('--output')
  if (output) { await mkdir(path.dirname(path.resolve(output)), { recursive: true }); await writeFile(output, JSON.stringify({ prepareMs, summary, runs }, null, 2) + '\n') }
  console.log(JSON.stringify({ prepareMs, summary }))
}
