import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const slotCSSRule = '#slot{--slot:0}', remote = 'https://inline-remote.test/style.css'
const cases = [
  { id: 'namespace-string', root: '@namespace \"http://www.w3.org/2000/svg\";a{color:blue}', construct: true },
  { id: 'leaf', root: '@import "/author/child.css";.example{background-color:yellow}', child: '.example{color:blue}', construct: true },
  { id: 'qualified', root: '@import "/author/child.css" layer(shared) supports(display:grid) print;', child: '.example{color:blue}', construct: true },
  { id: 'false-supports', root: '@import "/author/child.css" layer(first) supports(not-a-property:invalid);@import "/author/last.css" layer(last);', child: '.example{color:blue!important}', last: '.example{color:green!important}', construct: true },
  { id: 'media-layer-order', root: '@import "/author/child.css" layer(first) print;@import "/author/last.css" layer(last);.example{color:yellow}', child: '.example{color:blue!important}', last: '.example{color:green!important}', construct: true },
  { id: 'repeated-anonymous', root: '@import "/author/child.css" layer;@import "/author/last.css" layer;@import "/author/child.css" layer;', child: '.example{color:blue!important}', last: '.example{color:green!important}', construct: true },
  { id: 'external-after-local', root: `@import "/author/child.css";@import "${remote}";`, child: '.example{color:green}' },
  { id: 'external-before-local', root: `@import "${remote}";@import "/author/child.css";`, child: '.example{color:green}' },
  { id: 'qualified-external', root: '@import "/author/child.css" layer(shared) print;', child: `@import "${remote}";.example{background-color:yellow}` },
  { id: 'parent-namespace', root: '@import "/author/child.css";@namespace "http://www.w3.org/2000/svg";a{color:green}', child: 'a{color:blue}' },
  { id: 'child-namespace', root: '@import "/author/child.css";a{background-color:yellow}', child: '@namespace "http://www.w3.org/2000/svg";a{color:blue}' },
  { id: 'invalid-late-import', root: '.example{color:red}@import "/author/child.css";', child: '.example{color:blue}' },
  { id: 'resource', root: '@import "/author/child.css";', child: '.example{color:blue;background-image:url("/pixel.svg?q=1#part")}', construct: true }
]
const compilers = {}, results = []
try {
  for (const binding of ['native', 'wasm']) compilers[binding] = await createCompiler({ binding })
  const records = cases.map(test => {
    const files = Object.fromEntries(Object.entries(test).filter(([key]) => ['root', 'child', 'last'].includes(key)))
    const managed = { entry: 'root', stylesheets: Object.entries(files).map(([id, css]) => ({ id, href: `/author/${id}.css`, css })) }
    const rendered = {}
    for (const [binding, compiler] of Object.entries(compilers)) {
      const bundle = compiler.prepareStylesheetBundle({ source: slotCSSRule, from: 'bundle', slotCSSRule, managed })
      const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, i) => [node.id, `/generated/${test.id}/${i}.css`]))
      const assets = compiler.renderStylesheetBundle({ bundle: JSON.parse(JSON.stringify(bundle)), urls, preserveResourceBase: true, inlineImports: true })
      const css = assets.find(asset => asset.id === bundle.graph.entry).css
      if (test.construct) assert(!css.includes('@import'), test.id + ': import-free string required')
      rendered[binding] = { css, assets }
    }
    assert.deepEqual(rendered.native, rendered.wasm, test.id)
    return { ...test, files, rendered }
  })
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      for (const test of records) for (const media of ['screen', 'print']) {
        const values = {}
        const variants = ['author', 'native', 'wasm', ...(test.construct ? ['constructed'] : [])]
        for (const variant of variants) {
          const page = await browser.newPage(), missing = [], errors = []
          const output = test.rendered[variant === 'constructed' ? 'native' : variant]
          try {
            await page.emulateMedia({ media }); page.on('pageerror', e => errors.push(e.message))
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              if (url.host === 'inline-remote.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
              if (url.pathname === '/pixel.svg') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>' })
              if (url.pathname === '/') {
                const style = variant === 'author' ? '<link rel="stylesheet" href="/author/root.css">' : variant === 'constructed' ? '' : `<style>${output.css}</style>`
                return route.fulfill({ contentType: 'text/html', body: `${style}<a id="html" class="example">html</a><svg xmlns="http://www.w3.org/2000/svg"><a id="svg" class="example">svg</a></svg>` })
              }
              const css = url.pathname.startsWith('/author/') ? test.files[url.pathname.slice(8, -4)] : output?.assets.find(a => a.href === url.pathname)?.css
              if (css === undefined) { missing.push(url.href); return route.fulfill({ status: 404, body: 'missing' }) }
              return route.fulfill({ contentType: 'text/css', body: css })
            })
            await page.goto('http://inline-bundle.test/')
            if (variant === 'constructed') await page.evaluate(css => { const sheet = new CSSStyleSheet(); sheet.replaceSync(css); document.adoptedStyleSheets = [sheet] }, output.css)
            values[variant] = await page.locator('.example').evaluateAll(elements => elements.map(el => { const s = getComputedStyle(el); return { id: el.id, color: s.color, background: s.backgroundColor, image: s.backgroundImage } }))
            assert.deepEqual(missing, []); assert.deepEqual(errors, [])
          } finally { await page.close() }
        }
        for (const variant of variants.slice(1)) {
          const result = { id: test.id, browser: name, media, variant, actual: values[variant], expected: values.author, result: JSON.stringify(values[variant]) === JSON.stringify(values.author) ? 'PASS' : 'FAIL' }
          results.push(result); console.log(JSON.stringify(result))
        }
      }
    } finally { await browser.close() }
  }
  const summary = { cases: cases.length, comparisons: results.length, failures: results.filter(r => r.result === 'FAIL').length }
  console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)
} finally { for (const compiler of Object.values(compilers)) compiler.dispose() }
