import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { createRequire } from 'node:module'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
const packageDir = fileURLToPath(new URL('../../../../packages/next/', import.meta.url))
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test'), rows = []
const backend = process.env.BH_NEXT_BACKEND === 'webpack' ? '--webpack' : '--turbo'
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
async function freePort() {
  const server = createServer();server.listen(0, '127.0.0.1');await once(server, 'listening')
  const port = server.address().port;await new Promise(resolve => server.close(resolve));return port
}
const workspace = join(packageDir, 'e2e');mkdirSync(workspace, { recursive: true })
console.log(JSON.stringify({ backend, artifact: 'packages/next/dist/index.js', sha256: createHash('sha256').update(readFileSync(join(packageDir, 'dist/index.js'))).digest('hex') }))
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  if (process.env.BH_BROWSER && process.env.BH_BROWSER !== browserName) continue
  const root = mkdtempSync(join(workspace, 'bug-hunt-runtime-start-')), port = await freePort(), url = `http://127.0.0.1:${port}`
  mkdirSync(join(root, 'app'))
  writeFileSync(join(root, 'package.json'), '{"private":true,"type":"module"}')
  writeFileSync(join(root, 'next.config.js'), `import { withMasterCSS } from ${JSON.stringify(relative(root, join(packageDir, 'dist/index.js')))};export default withMasterCSS({}, {mode:'runtime'});`)
  writeFileSync(join(root, 'app/layout.jsx'), 'import "./globals.css";export default function Layout({children}){return <html><body>{children}</body></html>}')
  writeFileSync(join(root, 'app/page.jsx'), 'export default function Page(){return <div id="probe" className="card">Probe</div>}')
  const css = join(root, 'app/globals.css'), write = value => writeFileSync(css, `@master entry;@components{card{padding:${value}rem}}`)
  write(7)
  let output = '', browser, release
  const child = spawn(process.execPath, [join(packageDir, 'node_modules/next/dist/bin/next'), 'dev', backend, '--hostname', '127.0.0.1', '--port', String(port)], { cwd: root, env: { ...process.env, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', chunk => { output += chunk });child.stderr.on('data', chunk => { output += chunk })
  try {
    const deadline = Date.now() + 60000
    while (true) {
      assert.equal(child.exitCode, null, output)
      let response
      try { response = await fetch(url) } catch {}
      if (response?.status === 200) break
      if (response?.status >= 500 && /Module parse failed|Module not found/.test(output)) throw new Error('Next compilation failed before browser startup; see captured server output')
      assert.ok(Date.now() < deadline, output);await delay(200)
    }
    browser = await browsers[browserName].launch()
    const page = await browser.newPage(), errors = [], diagnostics = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') diagnostics.push(message.text()) })
    let requested
    const seen = new Promise(resolve => { requested = resolve }), gate = new Promise(resolve => { release = resolve })
    await page.route('**/*.wasm*', async route => { requested(route.request().url());await gate;await route.continue() })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const wasmURL = await seen, started = Date.now()
    await page.waitForFunction(() => window.__MASTER_CSS_NEXT_RUNTIME__?.startToken)
    await page.evaluate(() => { window.initialToken = window.__MASTER_CSS_NEXT_RUNTIME__.startToken;window.keepState = 'retained' })
    write(9)
    await page.waitForFunction(() => window.__MASTER_CSS_NEXT_RUNTIME__.startToken !== window.initialToken, undefined, { timeout: 2000 })
    const heldMs = Date.now() - started
    release()
    let failure
    try { await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')).paddingTop === '144px', undefined, { timeout: 4000 }) } catch (error) { failure = error.message }
    const state = await page.evaluate(() => ({ marker: window.keepState, padding: getComputedStyle(document.querySelector('#probe')).paddingTop, styles: Array.from(document.querySelectorAll('style#master-css')).map(style => Array.from(style.sheet.cssRules).map(rule => rule.cssText)) }))
    const pass = !failure && errors.length === 0 && state.marker === 'retained' && !diagnostics.some(message => message.includes('RUNTIME_STARTUP_TIMEOUT'))
    const row = { browser: browserName, pass, wasmURL, heldMs, state, errors, diagnostics, failure };rows.push(row);console.log(JSON.stringify(row))
  } catch (error) {
    const row = { browser: browserName, pass: false, harnessOrHostFailure: String(error), output };rows.push(row);console.log(JSON.stringify(row))
  } finally {
    release?.();await browser?.close()
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');child.kill('SIGTERM')
      const timeout = setTimeout(() => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL') }, 5000)
      await exited;clearTimeout(timeout)
    }
    rmSync(root, { recursive: true, force: true })
  }
}
console.log(JSON.stringify({ summary: true, observations: rows.length, failures: rows.filter(row => !row.pass).length }))
process.exitCode = rows.some(row => !row.pass) ? 1 : 0
