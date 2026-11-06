/** Run against built HTML: MASTER_SITE_OUT=/path/to/out node --test site/tests/docs-navigation-first-paint.e2e.mjs. */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { chromium, webkit } from '@playwright/test'

const engine = process.env.MASTER_SITE_BROWSER ?? 'chromium'
const output = resolve(process.env.MASTER_SITE_OUT ?? fileURLToPath(new URL('../out/', import.meta.url)))
const syntax = '/tw/guide/syntax-tutorial'
const installation = '/tw/guide/installation'
const rail = 'nav.ui-toc[data-rail]'
const title = 'article.ui-docs-article h1'
const target = 'article h2#integrations'
const types = {
  '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2'
}

let browser, syntaxHTML, installationHTML, split
before(async () => {
  [syntaxHTML, installationHTML] = await Promise.all([syntax, installation].map(path => readFile(resolve(output, `.${path}.html`), 'utf8')))
  split = installationHTML.search(/<h2\b[^>]*\bid="integrations"/)
  assert.ok(split > installationHTML.indexOf('<h1>'), 'the fixture must hold back the first article section')
  browser = await ({ chromium, webkit })[engine].launch()
})
after(async () => { await browser?.close() })

async function openStream(t, { width = 1728, javaScriptEnabled = false } = {}) {
  const { promise: tail, resolve: release } = Promise.withResolvers()
  const server = createServer(async (request, response) => {
    const { pathname } = new URL(request.url, 'http://localhost')
    if (pathname === syntax || pathname === installation) {
      response.setHeader('Content-Type', 'text/html; charset=utf-8')
      if (pathname === syntax) return response.end(syntaxHTML)
      // Keep this response open until the browser has inspected the real build's initial HTML.
      response.write(installationHTML.slice(0, split))
      await tail
      return response.end(installationHTML.slice(split))
    }
    const file = resolve(output, `.${decodeURIComponent(pathname)}`)
    if (file.startsWith(output + sep)) {
      const data = await readFile(file).catch(() => undefined)
      if (data) {
        response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream')
        return response.end(data)
      }
    }
    response.writeHead(404).end()
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  let context
  t.after(async () => {
    release()
    await context?.close()
    await new Promise(resolve => server.close(resolve))
  })
  context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled, reducedMotion: 'reduce' })
  // External fonts and images are irrelevant to the streamed layout. Use the real local CSS and JS assets.
  await context.route(url => url.origin !== origin, route => route.abort())
  const page = await context.newPage()
  page.setDefaultTimeout(8000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))

  if (width >= 1024) {
    await page.goto(origin + syntax, { waitUntil: 'domcontentloaded' })
    const link = page.locator(`#sidebar a[href="${installation}"]`)
    await Promise.all([
      page.waitForURL(origin + installation, { waitUntil: 'commit' }),
      link.click({ noWaitAfter: true })
    ])
  } else {
    await page.goto(origin + installation, { waitUntil: 'commit' })
  }
  await page.locator(title).waitFor()
  await page.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')]
    .every(link => new URL(link.href).origin !== location.origin || link.sheet))
  assert.equal(await page.locator(title).textContent(), '安裝 Master CSS')
  assert.equal(await page.locator(title).isVisible(), true)
  assert.equal(await page.evaluate(() => document.readyState), 'loading')
  assert.equal(await page.locator(target).count(), 0)
  return { page, release, errors }
}

async function geometry(page) {
  const [heading, contents] = await page.evaluate(selectors => selectors.map(selector => {
    const element = document.querySelector(selector)
    if (!element?.getClientRects().length) return null
    const { x, width } = element.getBoundingClientRect()
    return { x, width }
  }), [title, rail])
  assert.ok(heading && contents, `the title and rail must both be visible while streaming: ${JSON.stringify({ heading, contents })}`)
  assert.ok(contents.x >= heading.x + heading.width - 1, 'the rail belongs to the right of the title')
  return { titleX: heading.x, titleWidth: heading.width, railX: contents.x, railWidth: contents.width }
}

test(`${engine}: desktop navigation paints the title and rail together without JavaScript`, { timeout: 30000 }, async t => {
  const { page, release } = await openStream(t)
  const early = await geometry(page)
  assert.equal(await page.locator(`${rail} a[href="#integrations"]`).isVisible(), true)
  release()
  await page.waitForLoadState('domcontentloaded')
  assert.equal(await page.locator(target).count(), 1)
  assert.deepEqual(await geometry(page), early, 'the article and rail must not shift when the rest of the article arrives')
  t.diagnostic(`First paint and final layout: ${JSON.stringify(early)}`)
})

test(`${engine}: a hydrated rail link can target a section still in flight`, { timeout: 30000 }, async t => {
  const { page, release, errors } = await openStream(t, { javaScriptEnabled: true })
  const link = page.locator(`${rail} a[href="#integrations"]`)
  assert.equal(await link.isVisible(), true, 'the rail must be usable during the held response')
  await page.locator(`astro-island:not([ssr]) > ${rail}`).waitFor()
  assert.equal(await page.locator(target).count(), 0)
  const historyLength = await page.evaluate(() => history.length)
  const box = await link.boundingBox()
  assert.ok(box)
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForURL('**/tw/guide/installation#integrations', { waitUntil: 'commit' })
  assert.equal(await page.evaluate(() => document.readyState), 'loading')
  assert.equal(await page.evaluate(() => history.length), historyLength + 1)
  release()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForFunction(selector => {
    const heading = document.querySelector(selector)
    const current = document.querySelector('nav[data-rail] a[href="#integrations"]')
    const top = heading?.getBoundingClientRect().top
    return scrollY > 0 && top >= 0 && top < innerHeight && current?.getAttribute('aria-current') === 'location'
  }, target)
  assert.equal(await page.evaluate(() => history.length), historyLength + 1)
  assert.deepEqual(errors, [])
})

test(`${engine}: mobile navigation retains the static contents disclosure`, { timeout: 30000 }, async t => {
  const { page, release } = await openStream(t, { width: 390 })
  assert.equal(await page.locator(rail).isVisible(), false)
  const disclosure = page.locator('details[data-contents-disclosure]')
  assert.equal(await disclosure.locator('summary').isVisible(), true)
  await disclosure.locator('summary').click()
  const link = disclosure.locator('a[href="#integrations"]')
  assert.equal(await link.isVisible(), true)
  release()
  await page.waitForLoadState('domcontentloaded')
  await link.click()
  await page.waitForURL('**/tw/guide/installation#integrations')
  await page.waitForFunction(selector => {
    const top = document.querySelector(selector)?.getBoundingClientRect().top
    return scrollY > 0 && top >= 0 && top < innerHeight
  }, target)
})
