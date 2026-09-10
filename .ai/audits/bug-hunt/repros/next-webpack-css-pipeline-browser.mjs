import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const packageDir = process.env.BH_NEXT_PACKAGE_DIR ?? fileURLToPath(new URL('../../../../packages/next/', import.meta.url))
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test'), rows = [], delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const syntax = process.env.BH_CSS_SYNTAX ?? 'css', lightning = process.env.BH_LIGHTNING === '1'
const production = process.env.BH_NEXT_PHASE === 'build'
const partial = process.env.BH_SASS_PARTIAL === '1'
const recovery = process.env.BH_SASS_RECOVERY === '1'
assert.ok(!recovery || partial && !production)
assert.ok(!partial || syntax !== 'css')
const backend = process.env.BH_NEXT_BACKEND === 'turbo' ? '--turbo' : '--webpack'
assert.ok(['css', 'scss', 'sass'].includes(syntax))
const viteRequire = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const sassImplementation = syntax === 'css' ? undefined : createRequire(viteRequire.resolve('vite')).resolve('sass')
const server = createServer();server.listen(0, '127.0.0.1');await once(server, 'listening')
const port = server.address().port;await new Promise(resolve => server.close(resolve))
const workspace = join(packageDir, 'e2e');mkdirSync(workspace, { recursive: true })
const root = mkdtempSync(join(workspace, 'bug-hunt-webpack-css-')), url = `http://127.0.0.1:${port}`
mkdirSync(join(root, 'app'))
if (partial) mkdirSync(join(root, 'app/parts'))
if (sassImplementation) {
  mkdirSync(join(root, 'node_modules'))
  symlinkSync(dirname(sassImplementation), join(root, 'node_modules/sass'), 'dir')
}
writeFileSync(join(root, 'package.json'), '{"private":true,"type":"module"}')
const options = { ...(sassImplementation ? { sassOptions: { implementation: sassImplementation, ...(process.env.BH_SASS_STYLE ? { style: process.env.BH_SASS_STYLE } : {}), ...(process.env.BH_SASS_ADDITIONAL_DATA ? { additionalData: process.env.BH_SASS_ADDITIONAL_DATA } : {}) } } : {}), ...(lightning ? { experimental: { useLightningcss: true } } : {}) }
const captureFile = join(root, 'prepared.jsonl'), captureLoader = join(root, 'capture-prepared.cjs')
let captureConfig = ''
if (process.env.BH_CAPTURE_PREPARED === '1') {
  writeFileSync(captureLoader, `const fs=require('node:fs');module.exports=function(source,map){fs.appendFileSync(${JSON.stringify(captureFile)},JSON.stringify({file:this.resourcePath,source,loaders:this.loaders.map(l=>({path:l.path,options:l.options}))})+'\\n');this.callback(null,source,map)};`)
  captureConfig = `config.webpack=function(value){function visit(rule){if(!rule||typeof rule!=='object')return;for(const key of ['rules','oneOf'])for(const child of rule[key]||[])visit(child);if(Array.isArray(rule.use)){const index=rule.use.findIndex(item=>/postcss-loader|lightningcss-loader/.test(item?.loader||''));if(index>=0){for(const item of rule.use)if(typeof item?.options?.importLoaders==='number')item.options={...item.options,importLoaders:item.options.importLoaders+1};rule.use.splice(index+1,0,{loader:${JSON.stringify(captureLoader)}})}}}for(const rule of value.module?.rules||[])visit(rule);return value};`
}
let configuredSuffix = ''
if (process.env.BH_MODULE_AS === '1') configuredSuffix += `for(const rule of configured.turbopack.rules['*'])if(rule.type==='css-module')rule.as='*.module.css';`
if (process.env.BH_CAPTURE_TRANSFORMED === '1') {
  writeFileSync(captureLoader, `const fs=require('node:fs');module.exports=function(source,map){fs.appendFileSync(${JSON.stringify(captureFile)},JSON.stringify({file:this.resourcePath,source,map})+'\\n');this.callback(null,source,map)};`)
  configuredSuffix += `for(const rule of configured.turbopack.rules['*'])if(rule.loaders?.some(l=>String(typeof l==='string'?l:l.loader).endsWith('stylesheet-loader.js')))rule.loaders.unshift({loader:${JSON.stringify(captureLoader)}});`
}
writeFileSync(join(root, 'next.config.js'), `import { withMasterCSS } from ${JSON.stringify(relative(root, join(packageDir, 'dist/index.js')))};const config=${JSON.stringify(options)};${captureConfig}const configured=withMasterCSS(config, {mode:'pre-render'});${configuredSuffix}export default configured;`)
writeFileSync(join(root, 'app/layout.jsx'), `import "./master.css";import "./globals.${syntax}";export default function Layout({children}){return <html><body>{children}</body></html>}`)
writeFileSync(join(root, 'app/page.jsx'), `"use client";import styles from "./card.module.${syntax}";import manifest from "./master.css?master-css-manifest";export default function Page(){return <div id="global" className="global"><div id="module" className={styles.card} data-manifest={manifest.version} data-exports={JSON.stringify(styles)}>Probe</div></div>}`)
writeFileSync(join(root, 'app/master.css'), '@master entry;')
writeFileSync(join(root, 'app/imported.css'), '@reference "./master.css";.global{@compose p:1rem;}')
writeFileSync(join(root, 'app/dot.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="red"/></svg>')
function write(margin, padding) {
  let global = syntax === 'sass'
    ? `@import "./imported.css"\n$space: ${margin}rem\n.global\n  margin: $space\n  background-image: url("./dot.svg")\n`
    : `@import "./imported.css";${syntax === 'scss' ? `$space:${margin}rem;` : ''}.global{margin:${syntax === 'scss' ? '$space' : `${margin}rem`};background-image:url("./dot.svg")}`
  if (process.env.BH_ENTRY_REFERENCE === '1') {
    assert.equal(syntax, 'css')
    writeFileSync(join(root, 'app/tokens.css'), `@utilities{audit-margin{margin:${margin}rem}}`)
    global = '@master entry;@reference "./tokens.css";' + global.replace(`margin:${margin}rem;`, '@compose audit-margin;')
  }
  if (process.env.BH_ENTRY_COMPOSE === '1') {
    assert.equal(syntax, 'css')
    global = '@master entry;' + global.replace(`margin:${margin}rem;`, `@compose m:${margin}rem;`)
  }
  let module = syntax === 'sass'
    ? `$padding: ${padding}rem\n@reference "./master.css"\n.card\n  @compose p:#{$padding}\n`
    : `${syntax === 'scss' ? `$padding:${padding}rem;` : ''}@reference "./master.css";.card{@compose p:${syntax === 'scss' ? '#{$padding}' : `${padding}rem`};}`
  const files = [[`globals.${syntax}`, global]]
  if (partial) {
    files.push(['parts/_card.scss', `$padding:${padding}rem;@reference "../master.css";.card{@compose p:#{$padding};}`])
    module = syntax === 'sass' ? '@use "./parts/card"\n' : '@use "./parts/card";'
  }
  files.push([`card.module.${syntax}`, module])
  for (const [name, source] of files) {
    const file = join(root, 'app', name)
    if (!existsSync(file) || readFileSync(file, 'utf8') !== source) writeFileSync(file, source)
  }
}
write(3, 2)
if (recovery) rmSync(join(root, 'app/parts/_card.scss'))
let restored = false
let output = '', browser, child, activePage, phase = 'server', activeErrors = []
function runNext(args) {
  const childProcess = spawn(process.execPath, [join(packageDir, 'node_modules/next/dist/bin/next'), ...args], { cwd: root, env: { ...process.env, NODE_ENV: production ? 'production' : 'development', NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
  childProcess.stdout.on('data', chunk => { output += chunk });childProcess.stderr.on('data', chunk => { output += chunk })
  return childProcess
}
console.log(JSON.stringify({ syntax, lightning, production, backend, partial, recovery, entryCompose: process.env.BH_ENTRY_COMPOSE === '1', entryReference: process.env.BH_ENTRY_REFERENCE === '1', additionalData: process.env.BH_SASS_ADDITIONAL_DATA, moduleAs: process.env.BH_MODULE_AS === '1', captureTransformed: process.env.BH_CAPTURE_TRANSFORMED === '1', sassImplementation, artifacts: Object.fromEntries(['index.js', 'webpack-stylesheets.js', 'webpack-virtual-modules.js', 'stylesheet-loader.js', 'prepare-stylesheet.js', 'sass-source-context.js'].filter(name => existsSync(join(packageDir, 'dist', name))).map(name => [name, createHash('sha256').update(readFileSync(join(packageDir, 'dist', name))).digest('hex')])) }))
try {
  if (production) {
    child = runNext(['build', backend])
    const [code, signal] = await once(child, 'exit')
    console.log(JSON.stringify({ buildExit: code, signal }))
    assert.equal(code, 0, 'Next production build failed')
  }
  child = runNext([...(production ? ['start'] : ['dev', backend]), '--hostname', '127.0.0.1', '--port', String(port)])
  const deadline = Date.now() + 60000
  while (true) {
    assert.equal(child.exitCode, null, output)
    let response
    try { response = await fetch(url, { signal: AbortSignal.timeout(10000) }) } catch {}
    if (response?.status === 200) break
    if (response?.status >= 500 && /Module parse failed|Module not found|Module build failed|MasterCSSError|first need to install|Error evaluating Node.js code|Expected newline|Invalid empty selector/.test(output)) {
      if (!recovery) throw new Error('Next compilation failed before browser startup')
      if (!restored) { write(3, 2);restored = true;console.log(JSON.stringify({ recovery: 'created missing partial after observed failure' })) }
    }
    assert.ok(Date.now() < deadline, 'Next did not become ready');await delay(200)
  }
  if (recovery) assert.ok(restored, 'Missing partial failure must be observed before recovery')
  for (const name of ['chromium', 'firefox', 'webkit']) {
    if (!production) write(3, 2)
    browser = await browsers[name].launch()
    const page = await browser.newPage(), errors = []
    activePage = page;activeErrors = errors;phase = `${name}:initial`
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#global')).marginTop === '48px' && getComputedStyle(document.querySelector('#module')).paddingTop === '32px')
    await page.evaluate(() => { window.cssPipelineMarker = 'retained' })
    if (!production) {
      phase = `${name}:hmr`
      write(5, 4)
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#global')).marginTop === '80px' && getComputedStyle(document.querySelector('#module')).paddingTop === '64px')
    }
    const state = await page.evaluate(async () => {
      const global = document.querySelector('#global'), module = document.querySelector('#module'), style = getComputedStyle(global)
      const assetURL = style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1]
      const image = new Image();image.src = assetURL;await image.decode()
      return { marker: window.cssPipelineMarker, manifest: module.dataset.manifest, className: module.className, margin: style.marginTop, padding: getComputedStyle(module).paddingTop, importedPadding: style.paddingTop, assetWidth: image.naturalWidth, assetURL }
    })
    assert.equal(state.marker, 'retained');assert.equal(state.manifest, '1');assert.notEqual(state.className, 'card');assert.deepEqual(errors, [])
    assert.equal(state.importedPadding, '16px');assert.equal(state.assetWidth, 1)
    const row = { browser: name, pass: true, state, errors };rows.push(row);console.log(JSON.stringify(row))
    await browser.close();browser = undefined
  }
} catch (error) {
  const state = await activePage?.evaluate(() => {
    const global = document.querySelector('#global'), module = document.querySelector('#module')
    return { marker: window.cssPipelineMarker, margin: global && getComputedStyle(global).marginTop, padding: module && getComputedStyle(module).paddingTop, className: module?.className, exports: module?.dataset.exports, manifest: module?.dataset.manifest }
  }).catch(() => undefined)
  rows.push({ pass: false });console.log(JSON.stringify({ pass: false, phase, state, errors: activeErrors, error: String(error), output }))
} finally {
  await browser?.close()
  if (child && child.exitCode === null && child.signalCode === null) {
    const exited = once(child, 'exit');child.kill('SIGTERM')
    const timeout = setTimeout(() => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL') }, 5000)
    await exited;clearTimeout(timeout)
  }
  if (existsSync(captureFile)) console.log(JSON.stringify({ prepared: readFileSync(captureFile, 'utf8').trim().split('\n').map(line => JSON.parse(line)) }))
  rmSync(root, { recursive: true, force: true })
}
console.log(JSON.stringify({ summary: true, observations: rows.length, failures: rows.filter(row => !row.pass).length, cssSupportDisabled: output.includes('Built-in CSS support is being disabled') }))
process.exitCode = rows.some(row => !row.pass) ? 1 : 0
