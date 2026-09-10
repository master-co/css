import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, extname } from 'node:path'
import { createRequire } from 'node:module'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const results = []
for (const managed of [false, true]) for (const mode of ['static', 'runtime', 'pre-render', 'progressive']) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-build-startup-browser-'))), clients = [], closes = []
  const reference = join(root, 'missing/nested/tokens.css'), events = [], waiting = []
  let watcher, server, terminal
  try {
    writeFileSync(join(root, 'style.css'), `${managed ? '@master entry;' : ''}@reference "./missing/nested/tokens.css";.target{@compose paint;}`)
    writeFileSync(join(root, 'entry.js'), 'import "./style.css";window.ready=true;')
    writeFileSync(join(root, 'index.html'), '<!doctype html><div class="target">Target</div><script type="module" src="./entry.js"></script>')
    watcher = await build({ root, cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode, runtime: false }), build: { watch: {}, minify: false } })
    assert('on' in watcher)
    watcher.on('event', event => {
      if (event.code === 'BUNDLE_END') closes.push(event.result.close())
      if (event.code === 'ERROR' || event.code === 'BUNDLE_END') terminal = event
      if (event.code === 'END' && terminal) { events.push(terminal);terminal = undefined;waiting.shift()?.() }
    })
    const next = async () => {
      if (!events.length) await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Build event timeout')), 10000)
        waiting.push(() => { clearTimeout(timer);resolve() })
      })
      return events.shift()
    }
    const initial = await next();assert.equal(initial.code, 'ERROR');assert.match(String(initial.error), /not found|ENOENT/)
    mkdirSync(dirname(reference), { recursive: true })
    writeFileSync(reference, '@utilities{paint{padding:3rem}}')
    assert.equal((await next()).code, 'BUNDLE_END')
    server = createServer((request, response) => {
      const path = new URL(request.url, 'http://localhost').pathname, file = join(root, 'dist', path === '/' ? 'index.html' : path)
      try {
        const content = readFileSync(file)
        response.setHeader('content-type', ({ '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' })[extname(file)] ?? 'application/octet-stream')
        response.end(content)
      } catch { response.statusCode = 404;response.end() }
    })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const url = `http://127.0.0.1:${server.address().port}/`
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[browserName].launch(), page = await browser.newPage(), errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()}:${response.url()}`) })
      clients.push({ browserName, browser, page, errors })
    }
    for (const padding of [3, 7]) {
      if (padding === 7) { writeFileSync(reference, '@utilities{paint{padding:7rem}}');assert.equal((await next()).code, 'BUNDLE_END') }
      for (const client of clients) {
        await client.page.goto(url)
        await client.page.waitForFunction(expected => window.ready && getComputedStyle(document.querySelector('.target')).paddingTop === expected, `${padding * 16}px`)
        assert.deepEqual(client.errors, [])
        const row = { managed, mode, browser: client.browserName, phase: padding === 3 ? 'startup-recovered' : 'updated', padding: await client.page.locator('.target').evaluate(element => getComputedStyle(element).paddingTop), pass: true }
        results.push(row);console.log(JSON.stringify(row))
      }
    }
  } finally {
    for (const client of clients) await client.browser.close()
    if (server) await new Promise(resolve => server.close(resolve))
    await watcher?.close();await Promise.all(closes);rmSync(root, { recursive: true, force: true })
  }
}
console.log(JSON.stringify({ observations: results.length, failures: 0, scope: 'Built Vite plugin; local/managed CSS startup missing reference and subsequent update; default watch filters' }))
