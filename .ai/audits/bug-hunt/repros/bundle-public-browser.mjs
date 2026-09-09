import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'

const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const slotCSSRule = '#master-css-slot{--slot:0}'
const cases = [
  { id: 'before', before: '.example{color:green}' },
  { id: 'after', after: '.example{color:green}' },
  { id: 'named', before: '.example{color:red!important}', after: '.example{color:green!important}', wrappers: [['@layer named', ' layer(named)']] },
  { id: 'anonymous', before: '.example{color:red!important}', after: '.example{color:green!important}', wrappers: [['@layer', ' layer']] },
  { id: 'nested', before: '.example{color:red!important}', after: '.example{color:green!important}', wrappers: [['@layer', ' layer'], ['@supports (display:grid)', ' supports(display:grid)'], ['@media print', ' print']] },
  { id: 'false-supports', before: '.example{color:red}', wrappers: [['@supports (not-a-property:invalid)', ' supports(not-a-property:invalid)']] },
  { id: 'trivia', before: `/*🦀 ${slotCSSRule}*/.example{content:'${slotCSSRule}';color:green}` },
  { id: 'duplicate', after: '.example{color:green}', duplicate: true },
  { id: 'prefix', namespaces: "@namespace svg 'http://www.w3.org/2000/svg';", before: 'svg|a{fill:red}', after: 'svg|a{fill:blue;stroke:green}' },
  { id: 'default', namespaces: "@namespace 'http://www.w3.org/2000/svg';", before: 'a{color:red}', after: 'a{color:blue}' },
  { id: 'redeclared', namespaces: "@namespace ns 'http://www.w3.org/2000/svg';@namespace ns 'http://www.w3.org/1999/xhtml';", before: 'ns|a{color:red}', after: 'ns|a{color:green}' },
  { id: 'namespace-layer', namespaces: "@namespace svg url('http://www.w3.org/2000/svg');", before: 'svg|a{fill:red!important}', after: 'svg|a{fill:green!important}', wrappers: [['@layer', ' layer'], ['@media print', ' print']] },
  { id: 'layer-order-namespace', namespaces: "@layer first;@namespace svg 'http://www.w3.org/2000/svg';", before: 'svg|a{fill:red}', after: 'svg|a{fill:blue}' },
  { id: 'urls', namespaces: '@namespace ns url(namespace-uri);', before: '.example{outline-style:solid}', after: ".example{background-image:image-set('pixel.svg?q=1#part' 1x,url(big.svg) 2x);mask:url(#local);content:'url(fake.svg)'}", resources: true }
]

const compilers = {}
const records = []
let comparisons = 0
try {
  for (const binding of ['native', 'wasm']) {
    compilers[binding] = await createCompiler({ binding })
    assert.equal(compilers[binding].binding, binding)
  }
  for (const test of cases) {
    const before = test.before ?? '', after = test.after ?? '', namespaces = test.namespaces ?? ''
    const external = namespaces ? '' : "@import 'https://remote.test/style.css';"
    const imported = test.resources ? "@import 'paint.css?rev=1';" : ''
    const localCSS = '.example{background-color:yellow}'
    const managedCSS = `@import './local.css';${external}`
    const author = {
      'before.css': namespaces + before,
      'after.css': namespaces + after,
      'managed.css': managedCSS,
      'local.css': localCSS,
      'paint.css': '.example{outline-color:purple}',
      'inner.css': `@import 'before.css';@import 'managed.css';@import 'after.css';${test.duplicate ? "@import 'managed.css';" : ''}`
    }
    let source = `${before}${slotCSSRule}${after}${test.duplicate ? slotCSSRule : ''}`
    let previous = 'inner.css'
    for (const [index, [prelude, suffix]] of [...(test.wrappers ?? [])].reverse().entries()) {
      source = `${prelude}{${source}}`
      const name = `group-${index}.css`
      author[name] = `@import '${previous}'${suffix};`
      previous = name
    }
    source = `/*🦀*/${imported}${namespaces}${source}`
    author['entry.css'] = `${imported}@import '${previous}';`
    const compiled = {}
    for (const [binding, compiler] of Object.entries(compilers)) {
      const managed = compiler.compileStylesheets({
        graph: { entry: 'managed', files: { managed: managedCSS, local: localCSS }, edges: [{ from: 'managed', specifier: './local.css', resolved: 'local' }] },
        urls: { managed: '/old/managed.css', local: '/old/local.css' },
        baseManifest: { version: 1, utilities: [] }
      })
      const bundle = compiler.prepareStylesheetBundle({ source, from: 'bundle', slotCSSRule, managed })
      assert.equal(bundle.slots, test.duplicate ? 2 : 1)
      assert.equal(bundle.graph.stylesheets.find(s => s.id === 'managed').imports[0].resolved, 'local')
      if (test.resources) {
        const resource = bundle.sources.flatMap(s => s.resources).find(r => r.url === 'pixel.svg?q=1#part')
        assert(resource, JSON.stringify(bundle.sources))
        assert(source.slice(resource.start, resource.end).includes('pixel.svg?q=1#part'))
      }
      const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, index) => [node.id, `/generated/${test.id}/${index}.css`]))
      const assets = compiler.renderStylesheetBundle({
        bundle: JSON.parse(JSON.stringify(bundle)), urls,
        resourceURLs: { 'paint.css?rev=1': '/author/paint.css?rev=1', 'pixel.svg?q=1#part': '/author/pixel.svg?q=1#part', 'big.svg': '/author/big.svg', 'namespace-uri': '/wrong-namespace' }
      })
      assert(assets.find(a => a.id === 'managed').css.includes(urls.local))
      compiled[binding] = { bundle, assets, entry: urls.bundle }
    }
    assert.deepEqual(compiled.native, compiled.wasm, test.id)
    records.push({ ...test, source, author, compiled })
  }
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      for (const test of records) for (const media of ['screen', 'print']) {
        const values = {}
        for (const variant of ['author', 'native', 'wasm']) {
          const page = await browser.newPage()
          const missing = [], errors = [], requests = []
          const compiled = test.compiled[variant]
          const assets = new Map(compiled?.assets.map(a => [a.href, a.css]) ?? [])
          try {
            page.on('pageerror', error => errors.push(error.message))
            await page.emulateMedia({ media })
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              requests.push(url.pathname + url.search)
              if (['/author/pixel.svg', '/author/big.svg'].includes(url.pathname)) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>' })
              if (url.hostname === 'remote.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
              if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<link rel="stylesheet" href="${variant === 'author' ? '/author/entry.css' : compiled.entry}"><a class="example" id="html">html</a><svg xmlns="http://www.w3.org/2000/svg"><a id="svg" class="example"><rect width="10" height="10"/></a></svg>` })
              const css = url.pathname.startsWith('/author/') ? test.author[url.pathname.slice('/author/'.length)] : assets.get(url.pathname)
              if (css === undefined) { missing.push(url.pathname); return route.fulfill({ status: 404, body: 'missing' }) }
              return route.fulfill({ contentType: 'text/css', body: css })
            })
            await page.goto('http://bundle-public.test/')
            values[variant] = await page.locator('.example').evaluateAll(elements => elements.map(element => {
              const s = getComputedStyle(element)
              return { id: element.id, color: s.color, fill: s.fill, stroke: s.stroke, background: s.backgroundColor, image: s.backgroundImage, outline: s.outlineColor, content: s.content }
            }))
            if (test.resources) {
              assert(requests.includes('/author/pixel.svg?q=1'), JSON.stringify(requests))
              assert(requests.includes('/author/paint.css?rev=1'), JSON.stringify(requests))
              assert(!requests.some(url => url.includes('wrong-namespace') || url.includes('fake.svg')))
            }
            assert.deepEqual(missing, []); assert.deepEqual(errors, [])
          } finally { await page.close() }
        }
        for (const binding of ['native', 'wasm']) {
          assert.deepEqual(values[binding], values.author, `${test.id}/${name}/${media}/${binding}`)
          comparisons++
          console.log(JSON.stringify({ id: test.id, browser: name, media, binding, author: values.author, actual: values[binding], result: 'PASS' }))
        }
      }
    } finally { await browser.close() }
  }
  console.log(JSON.stringify({ cases: records.length, comparisons, failures: 0, scope: 'built public compiler native/Wasm compileStylesheets + prepareStylesheetBundle + JSON roundtrip + renderStylesheetBundle; actual browser CSS/SVG requests; build adapters still pending' }))
} finally {
  for (const compiler of Object.values(compilers)) compiler.dispose()
}
