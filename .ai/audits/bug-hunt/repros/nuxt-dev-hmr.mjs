import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'

assert(process.cwd().includes('master-css-bh-isolated-'))
const prepared = spawnSync('pnpm', ['exec', 'nuxt-module-build', 'prepare'], { env: process.env, stdio: 'inherit', timeout: 60000 })
assert.equal(prepared.status, 0, 'prepare isolated module source tsconfig')
const require = createRequire(resolve('package.json'))
const { chromium } = require('playwright-core')
const root = resolve('tests/audit-fixtures/runtime')
mkdirSync(join(root, 'node_modules'), { recursive: true })
for (const file of ['package.json', 'nuxt.config.ts', 'app.vue', 'app.css']) {
  writeFileSync(join(root, file), readFileSync(join('tests/fixtures/runtime', file)))
}
const appFile = join(root, 'app.vue'), cssFile = join(root, 'app.css')
const app = readFileSync(appFile, 'utf8').replace('<div class="box">', '<div id="native-probe" class="box">')
  .replace('    basic', '    <button id="counter" @click="count++">{{ count }}</button>')
  .replace('<script setup>', '<script setup>\nimport { ref, onMounted } from "vue"\nconst count = ref(0)\nonMounted(() => { document.documentElement.dataset.bhHydrated = "true" })')
writeFileSync(appFile, app)
const css = readFileSync(cssFile, 'utf8') + (process.env.BH_NUXT_NATIVE_CONTROL ? '\n:root { --color-host: #123456; }\n' : '')
writeFileSync(cssFile, css)
const configFile = join(root, 'nuxt.config.ts')
writeFileSync(configFile, readFileSync(configFile, 'utf8').replace('defineNuxtConfig({', 'defineNuxtConfig({\n  devtools: { enabled: false },'))
const probe = createServer()
await new Promise(done => probe.listen(0, '127.0.0.1', done))
const port = probe.address().port
await new Promise(done => probe.close(done))
const child = spawn(process.execPath, [resolve('node_modules/nuxt/bin/nuxt.mjs'), 'dev', root, '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe']
})
let output = ''
child.stdout.on('data', chunk => { output += chunk })
child.stderr.on('data', chunk => { output += chunk })
const variant = process.env.BH_NUXT_DIAG ? 'diag' : process.env.BH_NUXT_NATIVE_CONTROL ? 'control' : 'hmr'
const resultFile = process.env.BH_NUXT_RESULT || fileURLToPath(new URL(`../evidence/0060-nuxt-${variant}.json`, import.meta.url))
const records = [], errors = []
const pendingRequests = new Set()
let browser, page
const save = () => writeFileSync(resultFile, JSON.stringify({ records, errors }, null, 2))
try {
  const url = `http://127.0.0.1:${port}/`
  let ready = false
  const deadline = Date.now() + 180000
  while (Date.now() < deadline && child.exitCode === null) {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(3000) }); if (response.ok) { ready = true; break } } catch {}
    await new Promise(done => setTimeout(done, 200))
  }
  assert(ready, 'actual Nuxt dev server ready')
  browser = await chromium.launch()
  page = await browser.newPage()
  page.on('request', request => pendingRequests.add(request.url()))
  page.on('requestfinished', request => pendingRequests.delete(request.url()))
  page.on('requestfailed', request => {
    pendingRequests.delete(request.url())
    console.error('REQUEST FAILED', request.url(), request.failure()?.errorText)
  })
  page.on('console', message => { if (message.type() === 'error') console.error(message.text()) })
  page.on('response', response => { if (response.status() >= 400) console.error(response.status(), response.url()) })
  page.on('pageerror', error => { errors.push(String(error)); save() })
  let navigations = 0
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++ })
  await page.goto(url)
  await page.waitForFunction(() => getComputedStyle(document.getElementById('probe')).display === 'block', undefined, { timeout: 120000 })
  await page.locator('#counter').click()
  await page.waitForFunction(() => document.getElementById('counter').textContent === '1')
  await page.evaluate(() => { window.__BH_NUXT_MARKER = 'preserve' })
  const state = async currentPage => currentPage.evaluate(() => ({
    display: getComputedStyle(document.getElementById('probe')).display,
    color: getComputedStyle(document.getElementById('probe')).color,
    nativeColor: getComputedStyle(document.getElementById('native-probe')).color,
    counter: document.getElementById('counter').textContent,
    marker: window.__BH_NUXT_MARKER,
    hasRuntime: !!document.getElementById('master-css')
  }))
  const settledState = async (currentPage, display, color) => {
    const deadline = Date.now() + 120000
    while (Date.now() < deadline) {
      const before = navigations
      try {
        await currentPage.waitForFunction(expected => document.documentElement.dataset.bhHydrated === 'true'
          && !!document.getElementById('master-css')
          && getComputedStyle(document.getElementById('probe')).display === expected.display
          && getComputedStyle(document.getElementById('probe')).color === expected.color,
        { display, color }, { timeout: 10000 })
        await currentPage.waitForTimeout(2000)
        const result = await state(currentPage)
        if (before === navigations && result.display === display && result.color === color && result.hasRuntime) return result
      } catch (error) {
        if (!/Execution context was destroyed|Timeout .* exceeded/.test(String(error))) throw error
      }
    }
    throw new Error(`HMR did not settle at ${display}/${color}`)
  }
  const initial = await state(page)
  records.push({ stage: 'initial', browser: browser.version(), navigations, ...initial }); save()
  if (process.env.BH_NUXT_DIAG) {
    await page.waitForTimeout(1000)
    records.push({ stage: 'stylesheet-evidence', ...await page.evaluate(() => ({
      rootVariable: getComputedStyle(document.documentElement).getPropertyValue('--color-host'),
      styleTexts: Array.from(document.querySelectorAll('style')).map(s => s.textContent).filter(s => s.includes('--color-host')),
      runtimeRules: Array.from(document.getElementById('master-css').sheet.cssRules, r => r.cssText)
    })) }); save()
    const cold = await browser.newPage(); await cold.goto(url)
    await cold.waitForFunction(() => !!document.getElementById('master-css'))
    await cold.waitForTimeout(1000)
    records.push({ stage: 'cold-diagnostic', ...await state(cold) }); save()
    await page.evaluate(() => {
      const style = document.createElement('style')
      style.textContent = ':root { --color-host: #123456; }'
      document.head.append(style)
    })
    const nativeControl = await state(page)
    assert.equal(nativeControl.color, 'rgb(18, 52, 86)')
    assert.equal(nativeControl.nativeColor, 'rgb(18, 52, 86)')
    records.push({ stage: 'native-variable-control', ...nativeControl }); save()
  }
  assert.equal(initial.color, 'rgb(18, 52, 86)')
  let previousColor = initial.color
  for (const [display, hex, rgb] of [['grid', '#234567', 'rgb(35, 69, 103)'], ['flex', '#345678', 'rgb(52, 86, 120)'], ['block', '#123456', 'rgb(18, 52, 86)']]) {
    writeFileSync(appFile, app.replace('box block fg:host', `box ${display} fg:host`))
    const classState = await settledState(page, display, previousColor)
    records.push({ stage: `class-${display}`, navigations, ...classState }); save()
    writeFileSync(cssFile, css.replaceAll('#123456', hex))
    const changed = await settledState(page, display, rgb)
    assert.equal(changed.nativeColor, rgb)
    records.push({ stage: `theme-${hex}`, navigations, ...changed }); save()
    previousColor = rgb
  }
  const cold = await browser.newPage()
  await cold.goto(url)
  const final = await settledState(cold, 'block', 'rgb(18, 52, 86)')
  assert.equal(final.display, 'block')
  assert.equal(final.nativeColor, 'rgb(18, 52, 86)')
  assert(final.hasRuntime)
  records.push({ stage: 'cold-control', ...final }); save()
  assert.equal(errors.length, 0, 'no browser page errors')
  console.log(JSON.stringify({ complete: true, stages: records.length, navigations }))
} catch (error) {
  errors.push(String(error))
  if (page && !page.isClosed()) {
    records.push({ stage: 'failure-state', pendingRequests: [...pendingRequests], ...await page.evaluate(() => ({
      html: document.documentElement.outerHTML,
      runtimeCSS: Array.from(document.getElementById('master-css')?.sheet?.cssRules || [], rule => rule.cssText)
    })).catch(() => ({})) })
  }
  save(); throw error
}
finally {
  await browser?.close()
  if (child.exitCode === null) {
    const stopped = once(child, 'exit'); child.kill('SIGTERM')
    const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
    await stopped; clearTimeout(timer)
  }
  console.log(output)
  rmSync(root, { recursive: true, force: true })
}
