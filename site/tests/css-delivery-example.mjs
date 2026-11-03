/** Public-package reproduction for /guide/optimizing-css-delivery.
 * Run: node site/tests/css-delivery-example.mjs
 * The fixture has no first-party site APIs. Temporary installs reuse this checkout's
 * public package builds; this is not a registry installation test.
 */
import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, writeFile, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { chromium } from 'playwright'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const source = join(repo, 'tests/fixtures/css-delivery')
const scratch = await mkdtemp(join(tmpdir(), 'css-delivery-guide-'))
const cli = join(repo, 'packages/cli/dist/bin/index.js')
const vite = join(repo, 'node_modules/vite/bin/vite.js')
const browser = await chromium.launch(), results = { scratch, versions: {}, routes: [], pruning: {} }
const previewServers = []
for (const name of ['vite', '@master/css', '@master/css-vite', '@master/css-cli']) {
  const file = name === '@master/css-cli' ? join(repo, 'packages/cli/package.json') : join(repo, 'node_modules', name, 'package.json')
  const pkg = JSON.parse(await readFile(file, 'utf8')); results.versions[name] = pkg.version ?? 'checkout build'
}
try {
  for (const variant of ['before', 'after']) {
    const root = join(scratch, variant); await cp(source, root, { recursive: true })
    await symlink(join(repo, 'node_modules'), join(root, 'node_modules'))
    if (variant === 'before') await writeFile(join(root, 'src/main.js'), "import './style.css'\nimport './reports.css'\n")
    await writeFile(join(scratch, variant + '-build.log'), execFileSync(process.execPath, [vite, 'build'], { cwd: root }))
    const { preview } = await import('vite')
    const server = await preview({ root, configFile: join(root, 'vite.config.js'), preview: { port: 0, host: '127.0.0.1' } })
    previewServers.push(server); const origin = server.resolvedUrls.local[0].replace(/\/$/, '')
    const context = await browser.newContext({ viewport: { width: 900, height: 700 } }), page = await context.newPage()
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    for (const route of ['/', '/reports/']) {
      const response = await page.goto(origin + route, { waitUntil: 'networkidle' }); const html = await response.text()
      assert.match(html, /<style id="master-css"[^>]*>[^<]*\.p-lg/)
      const urls = await page.evaluate(() => [...new Set(performance.getEntriesByType('resource').filter(r => new URL(r.name).pathname.endsWith('.css')).map(r => r.name))])
      const css = await Promise.all(urls.map(async url => (await context.request.get(url)).text()))
      const all = css.join('\n')
      assert.match(all, /\.site-nav/)
      assert.equal(/\.report\s*\{/.test(all), variant === 'before' || route === '/reports/')
      if (route === '/reports/') {
        // Current local Vite transform has no pruning usage set. Keep the limitation explicit.
        assert.match(all, /\.report-debug/)
        const panel = page.locator('#report')
        await page.locator('#refresh').click()
        assert.equal(await panel.evaluate(e => getComputedStyle(e).borderTopWidth), '3px')
        assert.equal(await panel.evaluate(e => getComputedStyle(e).opacity), '1')
        await page.keyboard.press('Tab')
        assert.equal(await panel.evaluate(e => getComputedStyle(e).outlineWidth), '2px')
        await page.reload({ waitUntil: 'networkidle' })
        assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').filter(r => r.name.endsWith('.bin')).length), 0, 'progressive initially defers the program')
        const hydrationURL = await page.locator('style#master-css').getAttribute('data-master-css-hydration-manifest')
        assert.ok(hydrationURL)
        const hydration = await (await context.request.get(origin + hydrationURL)).text()
        assert.ok(!hydration.includes('letter-spacing:0.123em'))
        await panel.evaluate(e => e.classList.add('(letter-spacing:0.123em)'))
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#report')).letterSpacing !== 'normal')
        assert.ok(await page.evaluate(() => [...document.querySelector('style#master-css').sheet.cssRules].some(r => r.cssText.includes('0.123em'))))
        assert.ok(await page.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.endsWith('.bin'))), 'a new utility loads the deferred program')
      }
      results.routes.push({ variant, route, files: urls.length, raw: css.reduce((n,s) => n+Buffer.byteLength(s),0), gzip: css.reduce((n,s) => n+gzipSync(s).length,0), brotli: css.reduce((n,s) => n+brotliCompressSync(s).length,0) })
    }
    // A fresh Reports context is independent of navigation and still has complete states.
    const fresh = await browser.newPage(); await fresh.goto(origin + '/reports/', { waitUntil: 'networkidle' }); await fresh.locator('#refresh').click()
    assert.equal(await fresh.locator('#report').evaluate(e => getComputedStyle(e).borderTopWidth), '3px'); await fresh.close()
    assert.deepEqual(errors, []); await context.close()
  }
  const root = join(scratch, 'pruning-check'); await mkdir(root)
  await symlink(join(repo, 'node_modules'), join(root, 'node_modules'))
  for (const [from, to] of [['src/reports.css','reports.css'],['src/reports.js','reports.js'],['reports/index.html','index.html']]) await cp(join(source, from), join(root, to))
  await writeFile(join(root, 'package.json'), '{"name":"delivery-pruning-check","private":true}')
  await writeFile(join(root, 'style.css'), "@import '@master/css';\n@import './reports.css';\n")
  async function compile() {
    execFileSync(process.execPath, [cli, 'generate', 'index.html', 'reports.js', '--strict', '-o', 'output.css'], { cwd: root })
    const seen = new Set()
    async function css(file) {
      file = resolve(file); if(seen.has(file)) return ''; seen.add(file)
      const source = await readFile(file, 'utf8')
      return source + (await Promise.all([...source.matchAll(/@import\s+["']([^"']+)["']/g)].map(m => css(join(dirname(file), m[1]))))).join('\n')
    }
    return css(join(root, 'output.css'))
  }
  const first = await compile()
  for (const selector of [/\.report\s*\{/, /\.report-ready/, /\.report-idle/, /data-state/, /:focus-visible/, /--spacing-lg/]) assert.match(first, selector)
  assert.doesNotMatch(first, /\.report-debug/)
  // A bounded external name survives a safelist. Open-ended native source retains
  // its own rules; preservation must not be mistaken for inferred source usage.
  await writeFile(join(root, 'external.css'), '@preserve native; .cms-callout { border-left-width: 3px; }')
  await writeFile(join(root, 'style.css'), "@import '@master/css';@import './reports.css';@import './external.css';")
  const reports = await readFile(join(root, 'reports.css'),'utf8')
  await writeFile(join(root, 'reports.css'), reports+'\n@safelist "report-exported"; .report-exported { border-style: double; }\n')
  const external = await compile(); assert.match(external, /\.report-exported/); assert.match(external, /\.cms-callout/); assert.doesNotMatch(external, /\.report-debug/)
  results.pruning = { completeMap: true, laterStates: true, unusedRemoved: true, boundedSafelist: true, unknownSourcePreserved: true, viteLocalUsageSet: false }
  const before = results.routes.find(r => r.variant==='before' && r.route==='/'), after=results.routes.find(r=>r.variant==='after' && r.route==='/')
  assert.ok(after.raw < before.raw); assert.ok(after.files <= before.files)
  const output = process.env.DELIVERY_EVIDENCE ?? join(scratch, 'results.json')
  await writeFile(output, JSON.stringify(results,null,2)+'\n'); console.log(JSON.stringify(results,null,2))
} finally {
  await browser.close()
  for (const server of previewServers) await new Promise(resolve => server.httpServer.close(resolve))
}
