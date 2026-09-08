import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/src/index.ts'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = mkdtempSync(fileURLToPath(new URL('../../../../tmp/bug-hunt-mjs-vite-', import.meta.url)))
try {
  writeFileSync(join(root, 'index.html'), '<!doctype html><html><head></head><body><script type="module" src="./entry.mjs"></script></body></html>')
  writeFileSync(join(root, 'entry.mjs'), `import './index.css';const probe=document.createElement('div');probe.id='probe';probe.className='hidden';document.body.append(probe);`)
  writeFileSync(join(root, 'index.css'), '@master entry;')
  await build({ root, configFile: false, logLevel: 'warn', plugins: createMasterCSSVitePlugin({ mode: 'static' }) })
  const assets = readdirSync(join(root, 'dist/assets'))
  assert(assets.filter(path => path.endsWith('.css')).some(path => readFileSync(join(root, 'dist/assets', path), 'utf8').includes('.hidden{display:none}')))
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      const page = await browser.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.route('http://mjs-audit.test/**', route => {
        const path = new URL(route.request().url()).pathname
        const file = path === '/' ? 'index.html' : path.slice(1)
        return route.fulfill({ contentType: ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(file)], body: readFileSync(join(root, 'dist', file)) })
      })
      await page.goto('http://mjs-audit.test/')
      await page.locator('#probe').waitFor({ state: 'attached' })
      assert.equal(await page.locator('#probe').evaluate(element => getComputedStyle(element).display), 'none')
      assert.deepEqual(errors, [])
      console.log(JSON.stringify({ browser: name, actualViteStaticBuild: true, mjsOnlyClassCSS: 'PASS' }))
    } finally { await browser.close() }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
