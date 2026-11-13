/** Verify an existing production build; never builds, publishes, or deploys. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile, execFileSync } from 'node:child_process'
import { createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import path from 'node:path'
import { parse } from 'parse5'
import { chromium, firefox, webkit } from '@playwright/test'

const argument = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback
const out = path.resolve(argument('--out', 'site/out'))
const origin = new URL(argument('--origin', 'https://css.master.co')).origin
const reportPath = path.resolve(argument('--report', 'site/test-results/release-site/report.json'))
const engines = argument('--browsers', 'chromium,firefox,webkit').split(',')
const report = { revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), origin, out, pages: 0, localLinks: 0, profiles: [], noJavaScript: [], material: [], failures: [] }
report.sourceStatus = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=normal'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
const files = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)])
const inventory = files(out)
const html = inventory.filter(file => file.endsWith('.html'))
const routeOf = file => '/' + path.relative(out, file).split(path.sep).join('/').replace(/\.html$/, '').replace(/(^|\/)index$/, '')
const documents = new Map()
const indexable = new Map()
const redirectText = readFileSync(path.join(out, '_redirects'), 'utf8')
const redirects = redirectText.split('\n').filter(line => line && !line.startsWith('#')).map(line => line.trim().split(/\s+/))
const redirectFor = target => {
  for (const [from, to, status] of redirects) {
    const wildcard = from.endsWith('*')
    if (!(wildcard ? target.pathname.startsWith(from.slice(0, -1)) : target.pathname === from)) continue
    assert.ok([301, 302, 303, 307, 308].includes(Number(status)), `unsupported redirect status ${status}`)
    const destination = new URL(to.replace(':splat', wildcard ? target.pathname.slice(from.length - 1) : ''), origin)
    if (!destination.hash) destination.hash = target.hash
    if (!destination.search) destination.search = target.search
    return { destination, status: Number(status) }
  }
}
report.redirects = { rules: redirects.length, externalDestinations: [], liveEdgeVerified: false }
const resolveDestination = (target, visited = new Set()) => {
  if (target.origin !== origin) {
    assert.equal(target.protocol, 'https:', `external redirect must use HTTPS: ${target.href}`)
    assert.ok(!target.username && !target.password, 'redirect URLs must not contain credentials')
    if (!report.redirects.externalDestinations.includes(target.href)) report.redirects.externalDestinations.push(target.href)
    return target
  }
  assert.ok(!visited.has(target.href), `redirect loop: ${[...visited, target.href].join(' -> ')}`)
  assert.ok(visited.size < 20, 'redirect chain exceeds 20 hops')
  visited.add(target.href)
  const redirect = redirectFor(target)
  return redirect ? resolveDestination(redirect.destination, visited) : target
}
const findFile = pathname => {
  const file = path.resolve(out, '.' + decodeURIComponent(pathname))
  if (file !== out && !file.startsWith(out + path.sep)) return undefined
  return [file, file + '.html', path.join(file, 'index.html')].find(candidate => existsSync(candidate) && statSync(candidate).isFile())
}
// Engines run concurrently; order their entries by --browsers for a stable report.
const byEngine = (a, b) => engines.indexOf(a.engine) - engines.indexOf(b.engine)
const save = () => {
  report.profiles.sort(byEngine); report.noJavaScript.sort(byEngine); report.material.sort(byEngine)
  mkdirSync(path.dirname(reportPath), { recursive: true }); writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
}
const check = async (name, operation) => {
  try { await operation() } catch (error) { report.failures.push({ name, message: String(error) }); console.error(`${name}: ${error}`) }
}

for (const file of html) {
  const nodes = []
  const visit = node => { if (node.tagName) nodes.push({ tag: node.tagName, ...Object.fromEntries(node.attrs.map(({ name, value }) => [name, value])) }); for (const child of node.childNodes ?? []) visit(child) }
  const document = parse(readFileSync(file, 'utf8'))
  visit(document)
  const root = document.childNodes.find(node => node.tagName === 'html')
  const headNodes = root?.childNodes.find(node => node.tagName === 'head')?.childNodes ?? []
  const bodyNodes = root?.childNodes.find(node => node.tagName === 'body')?.childNodes ?? []
  const structuredData = [...headNodes, ...bodyNodes].filter(node =>
    node.tagName === 'script' && node.attrs.some(attr => attr.name === 'type' && attr.value === 'application/ld+json'))
    .map(node => node.childNodes[0]?.value)
  const metadata = headNodes.filter(node => node.tagName === 'meta' || node.tagName === 'link').map(node =>
    ({ tag: node.tagName, ...Object.fromEntries(node.attrs.map(({ name, value }) => [name, value])) }))
  const title = headNodes.find(node => node.tagName === 'title')?.childNodes[0]?.value
  documents.set(file, { nodes, ids: nodes.filter(node => node.id).map(node => node.id), metadata, title, structuredData })
}
report.pages = html.length
report.buildDigest = createHash('sha256').update(inventory.sort().map(file => `${path.relative(out, file)}:${createHash('sha256').update(readFileSync(file)).digest('hex')}`).join('\n')).digest('hex')
await check('built route inventory', () => assert.ok(html.length > 0, 'production HTML exists'))
for (const [file, { nodes, ids, metadata, title, structuredData }] of documents) await check(routeOf(file), () => {
  const route = routeOf(file)
  assert.equal(new Set(ids).size, ids.length, 'document IDs are unique')
  if (/^\/(?:(?:ja|tw|ko|cn)\/)?reference(?:\/|$)/.test(route)) {
    const main = nodes.filter(node => node.tag === 'main')
    assert.equal(main.length, 1, 'Reference has one main landmark')
    assert.ok(main[0].class?.split(/\s+/).includes('reference-document'), 'Reference main retains reference-document styles in every locale')
  }
  const canonical = metadata.filter(node => node.tag === 'link' && node.rel === 'canonical')
  const alternateLinks = metadata.filter(node => node.rel === 'alternate' && node.hreflang)
  const noindex = metadata.some(node => node.name === 'robots' && /\bnoindex\b/i.test(node.content))
  if (/^\/(?:(?:ja|tw|ko|cn)\/)?404$/.test(route) || route.startsWith('/examples/')) {
    assert.ok(noindex, '404 and embedded examples stay out of search indexes')
    assert.equal(canonical.length, 0, 'noindex pages omit the canonical URL')
    assert.equal(alternateLinks.length, 0, 'noindex pages omit hreflang')
  } else {
    assert.ok(!noindex, 'public pages are indexable')
    assert.equal(canonical.length, 1, 'one canonical URL')
    assert.equal(canonical[0].href, new URL(route, origin).href, 'canonical matches the build origin and route')
    indexable.set(canonical[0].href, alternateLinks.map(({ hreflang, href }) => [hreflang, href]))
    assert.ok(title?.trim(), 'page has a title')
    const meta = key => {
      const tags = metadata.filter(node => node.name === key || node.property === key)
      assert.equal(tags.length, 1, `one ${key} tag`)
      assert.ok(tags[0].content?.trim(), `${key} has content`)
      return tags[0].content
    }
    for (const key of ['description', 'og:title', 'og:description', 'og:site_name', 'og:type', 'og:locale', 'twitter:title', 'twitter:description', 'twitter:site']) meta(key)
    assert.equal(meta('og:url'), canonical[0].href, 'Open Graph URL matches the canonical URL')
    assert.equal(meta('twitter:card'), 'summary_large_image')
    for (const key of ['og:image', 'twitter:image']) {
      const image = new URL(meta(key))
      assert.equal(image.origin, origin, `${key} uses the build origin`)
      assert.match(image.pathname, /\.(?:png|jpe?g|webp)$/i, `${key} uses a supported static image`)
      assert.ok(findFile(image.pathname), `${key} image exists in the build`)
    }
    if (route === '/') {
      const website = structuredData.map(data => JSON.parse(data)).find(data => data['@type'] === 'WebSite')
      assert.equal(website?.name, 'Master CSS', 'homepage declares the site name')
      assert.equal(website.url, canonical[0].href, 'WebSite URL matches the homepage canonical URL')
    }
  }
  for (const node of nodes) for (const value of [node.href, node.src]) {
    if (!value || /^(?:data:|mailto:|tel:|javascript:)/.test(value)) continue
    let target = new URL(value, origin + route)
    if (target.origin !== origin) continue
    report.localLinks++
    target = resolveDestination(target)
    if (target.origin !== origin) continue
    const destination = findFile(target.pathname)
    assert.ok(destination, `missing local destination ${value}`)
    if (target.hash && documents.has(destination)) assert.ok(documents.get(destination).ids.includes(decodeURIComponent(target.hash.slice(1))), `missing anchor ${value}`)
  }
})
await check('redirect destinations', () => {
  for (const [from] of redirects) {
    // Exercise wildcard substitution against an existing root route as well as
    // links encountered above. This rejects cycles even in currently unused rules.
    const target = resolveDestination(new URL(from.replace('*', ''), origin))
    if (target.origin === origin) {
      const destination = findFile(target.pathname)
      assert.ok(destination, `missing redirect destination ${from} -> ${target.href}`)
      if (target.hash && documents.has(destination)) assert.ok(documents.get(destination).ids.includes(decodeURIComponent(target.hash.slice(1))), `missing redirect anchor ${target.href}`)
    }
  }
})
await check('sitemap and portable origins', () => {
  const sitemap = readFileSync(path.join(out, 'sitemap.xml'), 'utf8')
  const robots = readFileSync(path.join(out, 'robots.txt'), 'utf8')
  assert.ok(robots.split(/\r?\n/).includes(`Sitemap: ${origin}/sitemap.xml`), 'robots.txt advertises the build sitemap')
  const locations = []
  for (const [, entry] of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const location = entry.match(/<loc>([^<]+)<\/loc>/)?.[1]
    assert.ok(location && indexable.has(location), `sitemap URL is indexable: ${location}`)
    locations.push(location)
    const htmlAlternates = indexable.get(location)
    const xmlAlternates = [...entry.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)].map(match => match.slice(1))
    assert.deepEqual(xmlAlternates.sort(), htmlAlternates.sort(), `sitemap and HTML agree on hreflang for ${location}`)
    for (const [, href] of htmlAlternates) {
      assert.deepEqual(indexable.get(href)?.toSorted(), htmlAlternates, `hreflang is reciprocal for ${location} and ${href}`)
    }
  }
  assert.deepEqual(locations.sort(), [...indexable.keys()].sort(), 'sitemap lists each indexable canonical URL once')
  for (const name of ['llms.txt', 'llms-full.txt']) {
    const text = readFileSync(path.join(out, name), 'utf8')
    assert.ok(text.includes(origin + '/reference/'), `${name}: absolute current reference URLs`)
    if (origin === 'https://css.master.co') assert.ok(!text.includes('https://rc.css.master.co/'), `${name}: stale RC origin`)
    if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) assert.ok(!text.includes('http://localhost:'), `${name}: stale localhost origin`)
  }
})
save()
if (!process.argv.includes('--static-only')) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.md': 'text/markdown', '.txt': 'text/plain' }
  const server = createServer((request, response) => {
    const target = new URL(request.url, origin)
    const redirect = redirectFor(target)
    if (redirect) {
      const destination = redirect.destination
      const location = destination.origin === origin ? destination.pathname + destination.search + destination.hash : destination.href
      response.writeHead(redirect.status, { Location: location }); response.end(); return
    }
    const file = findFile(target.pathname)
    if (!file) { response.writeHead(404); response.end('Not found'); return }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(response)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  await check('local redirect response', async () => {
    const response = await fetch(base + '/en', { redirect: 'manual' })
    assert.equal(response.status, 301)
    assert.equal(response.headers.get('location'), '/')
  })
  const require = createRequire(import.meta.url)
  const axe = createRequire(require.resolve('eslint-plugin-jsx-a11y')).resolve('axe-core/axe.min.js')
  const editions = [
    { prefix: '', language: 'en', search: 'Search documentation' },
    { prefix: '/ja', language: 'ja', search: 'ドキュメントを検索' },
    { prefix: '/tw', language: 'zh-TW', search: '搜尋文件' },
    { prefix: '/ko', language: 'ko', search: '문서 검색' },
    { prefix: '/cn', language: 'zh-CN', search: '搜索文档' }
  ]
  const routes = editions.flatMap(edition => ['', '/guide/installation', '/reference/packages'].map(suffix => ({
    ...edition, route: edition.prefix + suffix || '/'
  })))
  routes.push(...['/guide/migration', '/guide/language-service'].map(route => ({ ...editions[0], route })))
  try {
    // Each engine has its own browser process and checks; running them together
    // takes the slowest engine's time instead of the sum of all three.
    await Promise.all(engines.map(engine => check(`${engine}: launch and profiles`, async () => {
      assert.ok({ chromium, firefox, webkit }[engine], `unknown browser ${engine}`)
      const browser = await ({ chromium, firefox, webkit })[engine].launch()
      try {
        for (const { route, language, search } of routes) for (const width of [390, 1280]) for (const scheme of ['light', 'dark']) await check(`${engine} ${route} ${width} ${scheme}`, async () => {
          const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme, reducedMotion: 'reduce' })
          try {
            const page = await context.newPage()
            const errors = []
            page.on('pageerror', error => errors.push(error.message))
            await page.addInitScript(theme => localStorage.setItem('theme-preference', theme), scheme)
            assert.equal((await page.goto(base + route, { waitUntil: 'networkidle' })).status(), 200)
            await page.evaluate(() => document.fonts.ready)
            assert.equal(await page.locator('html').getAttribute('lang'), language, 'document language matches its edition')
            assert.equal(await page.locator('main').count(), 1)
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false, 'no horizontal overflow')
            await page.addScriptTag({ path: axe })
            const audit = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }))
            const violations = audit.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }))
            assert.deepEqual(violations, [], JSON.stringify(violations))
            if (route.includes('/guide/installation')) {
              const name = search
              const trigger = page.getByRole('button', { name, exact: true }).first()
              await trigger.focus(); await page.keyboard.press('Enter')
              const dialog = page.getByRole('dialog', { name, exact: true })
              const input = dialog.getByRole('combobox', { name, exact: true })
              await input.fill('padding'); await dialog.getByRole('option').first().waitFor()
              await input.press('ArrowDown'); await input.press('Escape')
              assert.equal(await page.getByRole('dialog').count(), 0)
              assert.equal(await trigger.evaluate(element => element === document.activeElement), true)
            }
            assert.deepEqual(errors, [])
            report.profiles.push({ engine, route, width, scheme, axeRules: audit.passes.length, incomplete: audit.incomplete.map(({ id }) => id) })
          } finally { await context.close(); save() }
        })
        for (const { prefix, language } of editions) await check(`${engine}: ${language} no-JavaScript reading`, async () => {
          const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } })
          try {
            assert.equal((await page.goto(base + prefix + '/guide/installation')).status(), 200)
            assert.equal(await page.locator('html').getAttribute('lang'), language)
            assert.equal(await page.locator('main').isVisible(), true)
            const article = await page.locator('main').innerText()
            assert.ok(article.trim().length > 100, 'article text is rendered without JavaScript')
            if (language === 'en') assert.ok(article.includes('Installation'))
            report.noJavaScript.push({ engine, language, route: prefix + '/guide/installation' })
          } finally { await page.close() }
        })
      } finally { await browser.close() }
      await check(`${engine}: actual UI material and document example composition`, async () => {
        // Asynchronous execution keeps this process's artifact HTTP server responsive.
        const suites = ['ui-material-consumption.e2e.mjs', 'document-examples.e2e.mjs', 'guide-preview-reflow.e2e.mjs'].map(file => new URL(`../tests/${file}`, import.meta.url).pathname)
        const result = await new Promise(resolve => execFile(process.execPath, ['--test', ...suites], {
          env: { ...process.env, MASTER_SITE_URL: base, MASTER_SITE_BROWSER: engine },
          timeout: 420000,
          maxBuffer: 1024 * 1024,
        }, (error, stdout, stderr) => resolve({ passed: !error, output: stdout + stderr })))
        report.material.push({ engine, ...result })
        assert.equal(result.passed, true, result.output)
      })
    })))
  } finally { await new Promise(resolve => server.close(resolve)) }
}
save()
console.log(JSON.stringify({ pages: report.pages, localLinks: report.localLinks, profiles: report.profiles.length, failures: report.failures.length, report: reportPath }))
assert.deepEqual(report.failures, [], 'release site checks must all pass; see the report for details')
