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
const resultFile = fileURLToPath(new URL(`../evidence/0060-nuxt-${variant}.json`, import.meta.url))
const records = [], errors = []
let browser
const save = () => writeFileSync(resultFile, JSON.stringify({ records, errors }, null, 2))
try {
  const url = `http://127.0.0.1:${port}/`
  let ready = false
  const deadline = Date.now() + 90000
  while (Date.now() < deadline && child.exitCode === null) {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(3000) }); if (response.ok) { ready = true; break } } catch {}
    await new Promise(done => setTimeout(done, 200))
  }
  assert(ready, 'actual Nuxt dev server ready')
  browser = await chromium.launch()
  const page = await browser.newPage()
  page.on('pageerror', error => { errors.push(String(error)); save() })
  let navigations = 0
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++ })
  await page.goto(url)
  await page.waitForFunction(() => getComputedStyle(document.getElementById('probe')).display === 'block')
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
  for (const [display, hex, rgb] of [['grid', '#234567', 'rgb(35, 69, 103)'], ['flex', '#345678', 'rgb(52, 86, 120)'], ['block', '#123456', 'rgb(18, 52, 86)']]) {
    writeFileSync(appFile, app.replace('box block fg:host', `box ${display} fg:host`))
    await page.waitForFunction(expected => document.documentElement.dataset.bhHydrated === 'true' && !!document.getElementById('master-css') && getComputedStyle(document.getElementById('probe')).display === expected, display)
    records.push({ stage: `class-${display}`, navigations, ...await state(page) }); save()
    writeFileSync(cssFile, css.replaceAll('#123456', hex))
    const ready = expected => document.documentElement.dataset.bhHydrated === 'true'
      && !!document.getElementById('master-css')
      && getComputedStyle(document.getElementById('probe')).color === expected.rgb
      && getComputedStyle(document.getElementById('probe')).display === expected.display
    await page.waitForFunction(ready, { rgb, display })
    await page.waitForTimeout(2000)
    await page.waitForFunction(ready, { rgb, display })
    const changed = await state(page)
    assert.equal(changed.nativeColor, rgb)
    records.push({ stage: `theme-${hex}`, navigations, ...changed }); save()
  }
  const cold = await browser.newPage()
  await cold.goto(url)
  await cold.waitForFunction(() => document.documentElement.dataset.bhHydrated === 'true'
    && !!document.getElementById('master-css')
    && getComputedStyle(document.getElementById('probe')).display === 'block'
    && getComputedStyle(document.getElementById('probe')).color === 'rgb(18, 52, 86)')
  const final = await state(cold)
  assert.equal(final.display, 'block')
  assert.equal(final.nativeColor, 'rgb(18, 52, 86)')
  assert(final.hasRuntime)
  records.push({ stage: 'cold-control', ...final }); save()
  assert.equal(errors.length, 0, 'no browser page errors')
  console.log(JSON.stringify({ complete: true, stages: records.length, navigations }))
} catch (error) { errors.push(String(error)); save(); throw error }
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
