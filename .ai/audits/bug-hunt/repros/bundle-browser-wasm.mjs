import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { build } from 'vite'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'

const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const cache = join(repo, 'node_modules/.cache')
mkdirSync(cache, { recursive: true })
const work = mkdtempSync(join(cache, 'bundle-browser-wasm-'))
const slotCSSRule = '#master-css-slot{--slot:0}'
const request = {
  compile: {
    graph: { entry: 'managed', files: { managed: "@import './child.css';@utilities{paint{background-color:yellow}}", child: '.example{@compose paint;color:blue}' }, edges: [{ from: 'managed', specifier: './child.css', resolved: 'child' }] },
    urls: { managed: '/old/managed.css', child: '/old/child.css' }, baseManifest: { version: 1, utilities: [] }
  },
  source: `/*🦀*/@namespace svg 'http://www.w3.org/2000/svg';svg|a{fill:red}@media print{${slotCSSRule}}svg|a{fill:blue;background-image:url(pixel.svg?q=1#part)}`,
  from: 'bundle', slotCSSRule
}
function compile(compiler, request) {
  const managed = compiler.compileStylesheets(request.compile)
  const bundle = compiler.prepareStylesheetBundle({ source: request.source, from: request.from, slotCSSRule: request.slotCSSRule, managed })
  const urls = Object.fromEntries(bundle.graph.stylesheets.map((sheet, index) => [sheet.id, `/delivered/${index}.css`]))
  const assets = compiler.renderStylesheetBundle({ bundle: JSON.parse(JSON.stringify(bundle)), urls, resourceURLs: { 'pixel.svg?q=1#part': '/original/pixel.svg?q=1#part' } })
  return { bundle, assets, entry: urls[bundle.graph.entry] }
}
let server
try {
  writeFileSync(join(work, 'index.html'), '<!doctype html><script type="module" src="/entry.js"></script><svg xmlns="http://www.w3.org/2000/svg"><a id="svg" class="example"><rect width="10" height="10"/></a></svg>')
  writeFileSync(join(work, 'entry.js'), `import {createCompiler} from '@master/css-compiler';\n${compile.toString()}\nwindow.compileBundle=async request=>{const compiler=await createCompiler();try{return {binding:compiler.binding,...compile(compiler,request)}}finally{compiler.dispose()}}`)
  await build({ configFile: false, root: work, logLevel: 'warn', build: { outDir: 'dist', emptyOutDir: true } })
  const native = await createCompiler({ binding: 'native' })
  let expected
  try { expected = compile(native, request) } finally { native.dispose() }
  const assets = new Map(expected.assets.map(a => [a.href, a.css]))
  const requests = []
  server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    requests.push(url.pathname + url.search)
    if (assets.has(url.pathname)) { res.setHeader('Content-Type', 'text/css'); return res.end(assets.get(url.pathname)) }
    if (url.pathname === '/original/pixel.svg') { res.setHeader('Content-Type', 'image/svg+xml'); return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>') }
    try {
      const path = join(work, 'dist', url.pathname === '/' ? 'index.html' : url.pathname)
      res.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' }[extname(path)] ?? 'application/octet-stream')
      res.end(readFileSync(path))
    } catch { res.statusCode = 404; res.end('missing') }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  let comparisons = 0
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      for (const media of ['screen', 'print']) {
        const page = await browser.newPage()
        const errors = [], failures = []
        try {
          page.on('pageerror', e => errors.push(e.message))
          page.on('response', r => { if (r.status() >= 400) failures.push(r.url()) })
          await page.emulateMedia({ media })
          await page.goto(origin)
          await page.waitForFunction(() => typeof window.compileBundle === 'function')
          const actual = await page.evaluate(request => window.compileBundle(request), request)
          assert.equal(actual.binding, 'wasm')
          assert.deepEqual({ bundle: actual.bundle, assets: actual.assets, entry: actual.entry }, expected)
          // Publish the browser-produced bytes; equality above is an additional native control.
          for (const asset of actual.assets) assets.set(asset.href, asset.css)
          await page.evaluate(entry => new Promise((resolve, reject) => { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = entry; link.onload = resolve; link.onerror = reject; document.head.append(link) }), actual.entry)
          const style = await page.locator('#svg').evaluate(el => { const s = getComputedStyle(el); return { color: s.color, fill: s.fill, background: s.backgroundColor, image: s.backgroundImage } })
          assert.equal(style.fill, 'rgb(0, 0, 255)')
          assert.equal(style.background, media === 'print' ? 'rgb(255, 255, 0)' : 'rgba(0, 0, 0, 0)')
          assert.equal(style.color, media === 'print' ? 'rgb(0, 0, 255)' : 'rgb(0, 0, 0)')
          assert(style.image.includes('/original/pixel.svg?q=1#part'))
          assert.deepEqual(errors, []); assert.deepEqual(failures, [])
          comparisons++
          console.log(JSON.stringify({ browser: name, media, binding: actual.binding, assets: actual.assets.length, style, result: 'PASS' }))
        } finally { await page.close() }
      }
    } finally { await browser.close() }
  }
  assert(requests.some(path => path.endsWith('.wasm')))
  assert(requests.includes('/original/pixel.svg?q=1'))
  console.log(JSON.stringify({ comparisons, failures: 0, wasmFetched: true, scope: 'public compiler invoked inside all3browser realms; generic Vite packaging, no Master CSS build plugin' }))
} finally {
  if (server) await new Promise(resolve => server.close(resolve))
  rmSync(work, { recursive: true, force: true })
}
