import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/src/index.ts'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = mkdtempSync(fileURLToPath(new URL('../../../../tmp/bug-hunt-html-reference-', import.meta.url)))
try {
  writeFileSync(join(root, 'index.html'), `<!doctype html><html><head></head><body>
<div id="hidden" class="block&#32;hidden"></div>
<div id="inline" class=inline&#x2d;flex></div>
<div id="nbsp" class="flex&nbsp;grid"></div>
<div id="content" class="content:&quot;A&amp;B&quot;::before"></div>
<script type="module" src="./entry.js"></script></body></html>`)
  writeFileSync(join(root, 'entry.js'), `import './index.css'`)
  writeFileSync(join(root, 'index.css'), '@master entry;')
  await build({ root, configFile: false, logLevel: 'warn', plugins: createMasterCSSVitePlugin({ mode: 'static' }) })
  const css = readdirSync(join(root, 'dist/assets')).filter(path => path.endsWith('.css')).map(path => readFileSync(join(root, 'dist/assets', path), 'utf8')).join('\n')
  assert(css.includes('.hidden{display:none}'))
  assert(css.includes('.inline-flex{display:inline-flex}'))
  assert(!css.includes('.flex{display:flex}') && !css.includes('.grid{display:grid}'))
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      const page = await browser.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.route('http://html-reference.test/**', route => {
        const path = new URL(route.request().url()).pathname
        return route.fulfill({ contentType: ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(path)] ?? 'text/html', body: readFileSync(join(root, 'dist', path === '/' ? 'index.html' : path.slice(1))) })
      })
      await page.goto('http://html-reference.test/')
      await browsers.expect(page.locator('#hidden')).toHaveCSS('display', 'none')
      await browsers.expect(page.locator('#inline')).toHaveCSS('display', 'inline-flex')
      await browsers.expect(page.locator('#nbsp')).toHaveCSS('display', 'block')
      assert.equal(await page.locator('#content').evaluate(element => getComputedStyle(element, '::before').content), '"A&B"')
      assert.deepEqual(errors, [])
      console.log(JSON.stringify({ browser: name, actualStaticBuild: 'PASS', encodedWhitespace: 'PASS', unquotedAttribute: 'PASS', nonbreakingSpace: 'PASS', encodedContentString: 'PASS' }))
    } finally { await browser.close() }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
