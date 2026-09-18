// Batch 0248: actual `next dev --webpack` watch/HMR control for PostCSS-introduced (late) global references
// on the owned Next copy. Edits the referenced SVG bytes and the theme value after the first render and
// records what the browser observes. Output: BH_NEXT_HOST_EVIDENCE JSON. Requires MASTER_CSS_NATIVE_BINDING_PATH.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { join, relative, resolve } from 'node:path'

const packageDir = resolve(process.env.BH_NEXT_PACKAGE_DIR)
const evidence = resolve(process.env.BH_NEXT_HOST_EVIDENCE)
const requireNext = createRequire(join(packageDir, 'package.json'))
const playwright = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const browserNames = (process.env.BH_NEXT_BROWSERS || 'chromium').split(',')
const pure = process.env.BH_NEXT_PURE === '1'
const parent = join(packageDir, 'e2e');mkdirSync(parent, { recursive: true })
const root = mkdtempSync(join(parent, 'bug-hunt-resource-dev-'))
const report = { scenario: 'postcss-late-resource-dev-watch', bundler: 'webpack', pure, packageDir, steps: [], errors: [], serverLog: '' }
const svg = fill => `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect id="shape" width="2" height="2" fill="${fill}"/></svg>`
// Pure control: Next's pure-selector Module check rejects `:root`, so the authored globals live in a global stylesheet.
const stylesheet = color => pure ? '.direct{color:#123456;border-top:7px solid red}' : `@master entry;@preserve native;@theme{--image-audit:url("./new.svg?rev=1#shape");--color-audit:${color}}.direct{color:#123456;border-top:7px solid red}`
const globals = color => `:root{--image-audit:url("./new.svg?rev=1#shape");--color-audit:${color}}`
const writeStylesheets = color => { writeFileSync(join(root, 'app/card.module.css'), stylesheet(color));if (pure) writeFileSync(join(root, 'app/globals.css'), globals(color)) }
const delay = ms => new Promise(done => setTimeout(done, ms))
// Pure Next asset modules drop the `?rev=1` query and keep the fragment; Master publication preserves both. Record it, compare on the fragment.
const keepsReference = background => pure ? background.includes('#shape') : background.includes('?rev=1#shape')
async function freePort() {
  const server = createServer();server.listen(0, '127.0.0.1');await once(server, 'listening')
  const { port } = server.address();await new Promise(done => server.close(done));return port
}
let child
try {
  mkdirSync(join(root, 'app'))
  writeFileSync(join(root, 'package.json'), '{"private":true,"type":"module"}')
  const plugin = join(root, 'audit-postcss.cjs')
  writeFileSync(plugin, `const fs=require('node:fs');module.exports=()=>({postcssPlugin:'audit-late-reference',Once(root){const file=root.source?.input.file||'';fs.appendFileSync(${JSON.stringify(join(root, 'postcss.jsonl'))},JSON.stringify({file,css:root.toString()})+'\\n');if(file.endsWith('/card.module.css'))root.walkRules(rule=>{if(rule.selector==='.direct'){rule.append({prop:'background-image',value:'var(--image-audit)'});rule.append({prop:'outline-color',value:'var(--color-audit)'})}})}});module.exports.postcss=true`)
  writeFileSync(join(root, 'postcss.config.cjs'), `module.exports={plugins:{${JSON.stringify(plugin)}:{}}}`)
  const config = { experimental: { cpus: 1 } }
  writeFileSync(join(root, 'next.config.mjs'), pure ? `export default ${JSON.stringify(config)}` : `import {withMasterCSS} from ${JSON.stringify(relative(root, join(packageDir, 'dist/index.js')))};export default await withMasterCSS(${JSON.stringify(config)},{mode:'runtime',runtime:false})`)
  writeFileSync(join(root, 'app/layout.jsx'), (pure ? `import './globals.css'\n` : '') + `export default function RootLayout({children}){return <html lang="en"><body>{children}</body></html>}`)
  writeFileSync(join(root, 'app/page.jsx'), `'use client'\nimport {useEffect,useState} from 'react'\nimport styles from './card.module.css'\nexport default function Page(){const [hydrated,setHydrated]=useState(false);useEffect(()=>{setHydrated(true);window.__AUDIT_MARKER=window.__AUDIT_MARKER||'fresh'},[]);return <main data-hydrated={hydrated}><div id="probe" className={styles.direct}>Probe</div></main>}`)
  writeStylesheets('#111111')
  writeFileSync(join(root, 'app/new.svg'), svg('red'))
  const port = await freePort()
  child = spawn(process.execPath, [requireNext.resolve('next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NODE_ENV: 'development' }, stdio: ['ignore', 'pipe', 'pipe'] })
  for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { report.serverLog += bytes })
  const url = `http://127.0.0.1:${port}/`
  const deadline = Date.now() + 90000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('next dev exited early\n' + report.serverLog)
    try { const response = await fetch(url);if (response.status < 500) break } catch {}
    await delay(500)
  }
  for (const name of browserNames) {
    const browser = await playwright[name].launch({ headless: true })
    try {
      const page = await browser.newPage()
      const requests = []
      page.on('response', response => { if (response.url().includes('.svg')) requests.push({ url: response.url(), status: response.status() }) })
      page.on('pageerror', error => report.errors.push({ browser: name, message: String(error) }))
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.waitForSelector('main[data-hydrated="true"]', { timeout: 60000 })
      await page.evaluate(() => { window.__AUDIT_MARKER = 'preserved' })
      const observe = () => page.locator('#probe').evaluate(el => { const s = getComputedStyle(el);return { color: s.color, border: s.borderTopWidth, background: s.backgroundImage, outline: s.outlineColor, marker: window.__AUDIT_MARKER } })
      const fetchBackground = async observation => {
        const match = observation.background.match(/url\("?([^")]+)"?\)/)
        if (!match) return null
        const response = await page.request.get(match[1]);return { status: response.status(), body: (await response.text()).slice(0, 200) }
      }
      const initial = await page.waitForFunction(() => /^url\(/.test(getComputedStyle(document.getElementById('probe')).backgroundImage), null, { timeout: 30000 }).then(observe)
      const initialAsset = await fetchBackground(initial)
      report.steps.push({ browser: name, step: 'initial', observation: initial, asset: initialAsset, queryPreserved: initial.background.includes('?rev=1#shape'), pass: initial.color === 'rgb(18, 52, 86)' && initial.border === '7px' && keepsReference(initial.background) && initial.outline === 'rgb(17, 17, 17)' && initialAsset?.status === 200 && initialAsset.body.includes('fill="red"') })
      // Step 1: the late-referenced resource bytes change on disk.
      writeFileSync(join(root, 'app/new.svg'), svg('blue'))
      let assetAfter = null, afterSvg = null
      for (let i = 0; i < 60; i++) {
        await delay(1000)
        afterSvg = await observe()
        assetAfter = await fetchBackground(afterSvg)
        if (assetAfter?.body.includes('fill="blue"')) break
      }
      report.steps.push({ browser: name, step: 'svg-bytes-updated', observation: afterSvg, asset: assetAfter, urlChanged: afterSvg.background !== initial.background, pass: assetAfter?.status === 200 && assetAfter.body.includes('fill="blue"') && keepsReference(afterSvg.background) })
      // Step 2: the late-referenced theme value changes in the authored stylesheet.
      writeStylesheets('#222222')
      let afterTheme = null
      for (let i = 0; i < 60; i++) { await delay(1000);afterTheme = await observe();if (afterTheme.outline === 'rgb(34, 34, 34)') break }
      report.steps.push({ browser: name, step: 'theme-value-updated', observation: afterTheme, pass: afterTheme.outline === 'rgb(34, 34, 34)' && afterTheme.color === 'rgb(18, 52, 86)' && keepsReference(afterTheme.background) })
      // Step 3: the authored definition returns to the original value (round trip, cached snapshot reuse).
      writeStylesheets('#111111')
      let roundTrip = null
      for (let i = 0; i < 60; i++) { await delay(1000);roundTrip = await observe();if (roundTrip.outline === 'rgb(17, 17, 17)') break }
      report.steps.push({ browser: name, step: 'theme-value-round-trip', observation: roundTrip, pass: roundTrip.outline === 'rgb(17, 17, 17)' })
      report.svgResponses = requests
    } finally { await browser.close() }
  }
} catch (error) {
  report.harnessError = String(error.stack || error);process.exitCode = 1
} finally {
  if (child && child.exitCode === null) { child.kill('SIGTERM');await Promise.race([once(child, 'exit'), delay(5000)]);if (child.exitCode === null) child.kill('SIGKILL') }
  const trace = join(root, 'postcss.jsonl')
  if (existsSync(trace)) report.postcssCalls = readFileSync(trace, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)).map(row => ({ file: relative(root, row.file), late: row.css.includes('--image-audit'), css: row.css.slice(0, 400) }))
  writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n')
  rmSync(root, { recursive: true, force: true })
}
console.log(JSON.stringify({ scenario: report.scenario, pure, steps: report.steps.map(step => ({ browser: step.browser, step: step.step, pass: step.pass, urlChanged: step.urlChanged })), harnessError: report.harnessError, errors: report.errors }))
assert(report.steps.length)
