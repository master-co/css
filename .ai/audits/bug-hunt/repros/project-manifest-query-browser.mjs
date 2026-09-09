import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { createEngine } from '../../../../packages/css/dist/index.js'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
import WebpackPlugin from '../../../../packages/webpack/dist/index.js'
const viteRequire = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const webpackRequire = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))
const { build } = await import(viteRequire.resolve('vite'))
const webpack = webpackRequire('webpack')
const browsers = webpackRequire('@playwright/test')
const root = mkdtempSync(join(tmpdir(), 'master-css-manifest-query-'))
const results = []
try {
  mkdirSync(join(root, 'styles'))
  writeFileSync(join(root, 'entry.js'), "import manifest from './entry.css?master-css-manifest'; globalThis.manifest = manifest;")
  writeFileSync(join(root, 'index.html'), '<div id="probe" class="button"></div><script type="module" src="/entry.js"></script>')
  writeFileSync(join(root, 'styles/child.css'), "@import 'https://remote.invalid/external.css';@reference '../tokens.css';@components{widget{@compose paint;}}.native{color:blue}")
  writeFileSync(join(root, 'tokens.css'), '@utilities{paint{color:red}}')
  for (const condition of ['layer(shared)', 'layer', 'supports(display:grid) print']) {
    writeFileSync(join(root, 'entry.css'), `@import './styles/child.css' ${condition};@master entry;@components{button{@compose widget;}}`)
    for (const host of ['vite', 'webpack']) {
      const out = join(root, `dist-${host}`)
      if (host === 'vite') {
        await build({ root, base: './', configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode: 'runtime', runtime: false }), build: { outDir: out } })
      } else {
        const compiler = webpack({ mode: 'production', context: root, entry: './entry.js', resolve: { tsconfig: false }, output: { path: out, clean: true, filename: 'entry.js', publicPath: './' }, plugins: [new WebpackPlugin({ mode: 'runtime', runtime: false }, root)] })
        try {
          await new Promise((resolve, reject) => compiler.run((error, stats) => error ? reject(error) : stats.hasErrors() ? reject(new Error(stats.toString({ all: false, errors: true }))) : resolve()))
        } finally { await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve())) }
        writeFileSync(join(out, 'index.html'), '<div id="probe" class="button"></div><script defer src="./entry.js"></script>')
      }
      for (const browserName of ['chromium', 'firefox', 'webkit']) {
        const browser = await browsers[browserName].launch()
        try {
          const page = await browser.newPage()
          const errors = [], requests = []
          page.on('pageerror', error => errors.push(error.message))
          await page.route('**/*', route => {
            const url = new URL(route.request().url())
            requests.push(url.href)
            const file = join(out, decodeURIComponent(url.pathname))
            if (url.hostname !== 'manifest-query.test' || !existsSync(file)) return route.fulfill({ status: 404, body: 'missing' })
            return route.fulfill({ body: readFileSync(file), contentType: ({ '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' })[extname(file)] || 'application/octet-stream' })
          })
          await page.goto('http://manifest-query.test/index.html')
          await page.waitForFunction(() => globalThis.manifest?.version === 1)
          const manifest = await page.evaluate(() => globalThis.manifest)
          const engine = await createEngine({ manifest, binding: 'native' })
          try {
            engine.ensureClassRules(['button', 'widget', 'paint'])
            const css = engine.snapshot().text
            assert(css.includes('.button{color:red}') && css.includes('.widget{color:red}') && !css.includes('.paint{'))
            await page.addStyleTag({ content: css })
            await browsers.expect(page.locator('#probe')).toHaveCSS('color', 'rgb(255, 0, 0)')
          } finally { engine.dispose() }
          assert(requests.some(url => url.endsWith('.json')), 'production facade must fetch emitted manifest JSON')
          assert(!requests.some(url => url.includes('remote.invalid')), 'manifest-only import must not fetch native external CSS')
          assert.deepEqual(errors, [])
          const result = { host, condition, browser: browserName, manifestJSON: 'PASS', generatedCSS: 'PASS', errors }
          results.push(result); console.log(JSON.stringify(result))
        } finally { await browser.close() }
      }
    }
  }
  console.log(JSON.stringify({ comparisons: results.length, failures: 0, scope: 'actual built plugins, production manifest query; native engine consumes browser-delivered manifest; native stylesheet delivery and runtime hydration not covered' }))
} finally { rmSync(root, { recursive: true, force: true }) }
