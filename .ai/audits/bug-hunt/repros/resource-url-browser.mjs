import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { createCompiler } from '../../../../packages/compiler/src/index.ts'
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const font = readFileSync(new URL('../../../../site/out/fonts/IBMPlexMono-Medium.woff2', import.meta.url))
const wasmBytes = readFileSync(new URL('../../../../packages/binding-wasm-compiler/artifacts/mastercss_binding_wasm_compiler_bg.wasm', import.meta.url))
const child = `@font-face{font-family:AuditFont;src:url('../fonts/a.woff2?font=1')}@utilities{paint{background-image:u\\72l('images/hero.svg?v=1#hero')}}.native{background-image:image-set('images/small.svg?size=1' 1x,url(images/big.svg) 2x)}.font{font:20px AuditFont}.fragment{filter:url(#local-filter)}`
const entry = "@import './nested/child.css';.composed{@compose paint;}"
const referenceChild = child.replace(/@utilities\{paint\{[^}]*\}\}/, '')
const referenceEntry = "@import './nested/child.css';.composed{background-image:url('/source/nested/images/hero.svg?v=1#hero')}"
const request = {
  graph: { entry: 'entry', files: { entry, child }, edges: [{ from: 'entry', specifier: './nested/child.css', resolved: 'child' }] },
  urls: { entry: '/output/a.css', child: '/output/moved/b.css' },
  resourceURLs: { child: { 'images/hero.svg?v=1#hero': '/source/nested/images/hero.svg?v=1#hero', 'images/small.svg?size=1': '/source/nested/images/small.svg?size=1', 'images/big.svg': '/source/nested/images/big.svg', '../fonts/a.woff2?font=1': '/source/fonts/a.woff2?font=1' } },
  baseManifest: { version: 1, utilities: [] }
}
const native = await createCompiler({ binding: 'native' })
const wasm = await createCompiler({ binding: 'wasm', wasm: { input: wasmBytes } })
let result
try { result = native.compileStylesheets(request); assert.deepEqual(wasm.compileStylesheets(request), result) }
finally { native.dispose(); wasm.dispose() }
console.log(JSON.stringify({ nativeWasm: 'PASS', fontSHA256: createHash('sha256').update(font).digest('hex') }))
let failures = 0
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    const observations = {}
    for (const version of ['reference', 'compiled']) {
      const page = await browser.newPage({ deviceScaleFactor: 1 })
      const requests = []
      try {
        const sources = version === 'compiled' ? Object.fromEntries(result.stylesheets.map(a => [a.href, a.css])) : { '/source/entry.css': referenceEntry, '/source/nested/child.css': referenceChild }
        await page.route('**/*', async route => {
          const url = new URL(route.request().url())
          if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<link rel="stylesheet" href="${version === 'compiled' ? '/output/a.css' : '/source/entry.css'}"><style>div{width:100px;height:30px}</style><svg width="0" height="0"><filter id="local-filter"><feGaussianBlur stdDeviation="0"/></filter></svg><div class="composed">a</div><div class="native">b</div><div class="font">Font</div><div class="fragment">c</div>` })
          if (url.pathname in sources) return route.fulfill({ contentType: 'text/css', body: sources[url.pathname] })
          requests.push(url.pathname + url.search)
          if (url.pathname === '/source/fonts/a.woff2') return route.fulfill({ contentType: 'font/woff2', body: font })
          if (url.pathname.startsWith('/source/nested/images/')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>' })
          return route.fulfill({ status: 404, body: '' })
        })
        await page.goto('http://resources.test/', { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)
        observations[version] = { requests: requests.sort(), values: await page.evaluate(() => ({ composed: getComputedStyle(document.querySelector('.composed')).backgroundImage, native: getComputedStyle(document.querySelector('.native')).backgroundImage, filter: getComputedStyle(document.querySelector('.fragment')).filter, fontLoaded: document.fonts.check('20px AuditFont'), fonts: Array.from(document.fonts, font => ({ family: font.family, status: font.status })) })) }
      } finally { await page.close() }
    }
    assert.deepEqual(observations.reference.requests, ['/source/fonts/a.woff2?font=1', '/source/nested/images/hero.svg?v=1', '/source/nested/images/small.svg?size=1'])
    assert.equal(observations.reference.values.fontLoaded, true)
    assert.deepEqual(observations.reference.values.fonts, [{ family: 'AuditFont', status: 'loaded' }])
    try { assert.deepEqual(observations.compiled, observations.reference); console.log(JSON.stringify({ browser: name, result: 'PASS', ...observations })) }
    catch { failures++; console.log(JSON.stringify({ browser: name, result: 'FAIL', ...observations })) }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ browsers: 3, failures, scope: 'Prepared public graph; relocated image/font requests and cross-file composition against native CSS controls' }))
process.exitCode = failures ? 1 : 0
