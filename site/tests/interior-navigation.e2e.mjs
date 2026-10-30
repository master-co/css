/** Native navigation and secondary-page behavior, against the independent redesign preview. */
import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { before, after, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const browserName = process.env.MASTER_SITE_BROWSER ?? 'chromium'
const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3217'
const output = new URL(`../test-results/interior-redesign/navigation-${browserName}/`, import.meta.url)
let browser
before(async () => { await mkdir(output, { recursive: true }); browser = await ({ chromium, webkit })[browserName].launch() })
after(async () => { await browser?.close() })

async function open(route, { width = 390, scheme = 'light', js = true, touch = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce', javaScriptEnabled: js, hasTouch: touch })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const response = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 })
  if (route.endsWith('/404')) assert.ok([200, 404].includes(response.status()), 'a named 404 template is a normal HTML resource in static preview')
  else assert.equal(response.status(), 200)
  await page.evaluate(() => document.fonts.ready)
  return { context, page, errors }
}

test(`${browserName}: unknown paths serve the actual 404 response and recovery controls`, { timeout: 60000 }, async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } })
  const page = await context.newPage()
  try {
    for (const path of ['/missing-interior-review-page', '/tw/missing-interior-review-page']) {
      const response = await page.goto(base + path, { waitUntil: 'networkidle' })
      assert.equal(response.status(), 404)
      assert.equal(await page.locator('h1').count(), 1)
      assert.equal(await page.locator('.not-found-search').count(), 1)
      assert.equal(await page.locator('.not-found-guide').count(), 1)
      await noOverflow(page)
    }
  } finally { await context.close() }
})

async function noOverflow(page, selector = 'html') {
  const box = await page.locator(selector).evaluate(element => ({ content: element.scrollWidth, width: element.clientWidth }))
  assert.ok(box.content <= box.width + 1, `${selector}: ${box.content} > ${box.width}`)
}

for (const width of [320, 390, 768]) for (const section of ['guide', 'reference']) {
  test(`${browserName} ${width} ${section}: chapters, nested search, Escape and focus`, { timeout: 60000 }, async () => {
    const route = section === 'guide' ? '/guide/introduction' : '/reference/rules/conditions'
    const { context, page, errors } = await open(route, { width, scheme: section === 'reference' ? 'dark' : 'light', touch: true })
    try {
      const home = page.getByRole('link', { name: 'Master CSS home', exact: true }).first()
      assert.equal(await home.getAttribute('href'), '/')
      assert.ok((await home.boundingBox()).height >= 44, 'the logotype keeps a usable home target')
      const trigger = page.getByRole('button', { name: 'Menu', exact: true })
      await trigger.focus(); await trigger.press('Enter')
      const menu = page.getByRole('dialog', { name: 'Navigation', exact: true })
      await menu.waitFor()
      assert.equal(await menu.locator('.doc-menu-documents a').count() > 30, true)
      assert.equal(await menu.getByRole('button', { name: 'Close menu' }).count(), 1)
      const close = menu.getByRole('button', { name: 'Close menu' })
      await close.focus(); await page.keyboard.press('Shift+Tab')
      assert.equal(await menu.evaluate(element => element.contains(document.activeElement)), true, 'native modal focus stays inside the menu')
      const search = menu.getByRole('button', { name: 'Search documentation', exact: true })
      await search.click()
      const lookup = page.getByRole('dialog', { name: 'Search documentation', exact: true })
      await lookup.getByRole('combobox').pressSequentially('padding')
      await lookup.getByRole('option').first().waitFor()
      await page.keyboard.press('Escape')
      assert.equal(await menu.isVisible(), true)
      assert.equal(await search.evaluate(element => element === document.activeElement), true)
      await noOverflow(page, '.doc-menu')
      await page.screenshot({ path: new URL(`${width}-${section}-menu.png`, output).pathname })
      await page.keyboard.press('Escape')
      assert.equal(await page.getByRole('dialog').count(), 0)
      assert.equal(await trigger.evaluate(element => element === document.activeElement), true)
      await trigger.click()
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.waitForFunction(() => !document.querySelector('.doc-menu'))
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY !== 'hidden'), true)
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  })
}

test(`${browserName}: language changes retain a document query and semantic anchor`, { timeout: 60000 }, async () => {
  const { context, page } = await open('/guide/introduction?source=brand#what-is-master-css')
  try {
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    const select = page.locator('.doc-menu-preference select').nth(1)
    await Promise.all([page.waitForURL(url => url.pathname === '/tw/guide/introduction'), select.selectOption('tw')])
    const url = new URL(page.url())
    assert.equal(url.search, '?source=brand')
    assert.equal(url.hash, '#what-is-master-css')
    assert.equal(await page.getByRole('dialog').count(), 0)
    assert.equal(await page.getByRole('link', { name: 'Master CSS 首頁', exact: true }).count(), 1)
    const tracking = await page.locator('article.prose :is(h1,h2,h3)').evaluateAll(headings => headings.map(heading => getComputedStyle(heading).letterSpacing))
    assert.ok(tracking.every(value => value === 'normal' || parseFloat(value) === 0), 'the localized document keeps natural heading tracking')
  } finally { await context.close() }
})

test(`${browserName}: a contents jump creates one history entry and modified clicks keep native navigation`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/guide/introduction?source=brand', { width: 1440 })
  try {
    const original = page.url()
    const history = await page.evaluate(() => window.history.length)
    const link = page.locator('.doc-page-contents a[href^="#"]').nth(1)
    const hash = await link.getAttribute('href')
    await link.click()
    assert.equal(await page.evaluate(() => window.history.length), history + 1)
    assert.equal(new URL(page.url()).search, '?source=brand')
    assert.equal(new URL(page.url()).hash, hash)
    await page.goBack()
    assert.equal(page.url(), original, 'one Back returns to the document before the jump')
    // Headless browser chrome need not open a tab; the application must leave its native default alone.
    await page.evaluate(() => document.addEventListener('click', event => { window.__contentsModifiedClick = { modified: event.metaKey || event.ctrlKey, prevented: event.defaultPrevented } }, { once: true }))
    await link.click({ modifiers: ['ControlOrMeta'] })
    assert.deepEqual(await page.evaluate(() => window.__contentsModifiedClick), { modified: true, prevented: false })
    assert.equal(page.url(), original)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: enlarged navigation and contents disclosure retain local boundaries`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/tw/guide/typography', { width: 320 })
  try {
    await page.addStyleTag({ content: 'html{font-size:32px!important}' })
    await page.getByRole('button', { name: /Menu|選單/, exact: true }).click()
    await noOverflow(page, '.doc-menu')
    await page.locator('.doc-menu-preferences').scrollIntoViewIfNeeded()
    await page.screenshot({ path: new URL('320-tw-enlarged-menu.png', output).pathname })
    await page.keyboard.press('Escape')
    await noOverflow(page)
    const contents = page.locator('.doc-contents-disclosure')
    await contents.locator('summary').click()
    assert.equal(await contents.getAttribute('open'), '')
    const link = contents.locator('a').first()
    const hash = await link.getAttribute('href')
    await link.click()
    assert.equal(await contents.getAttribute('open'), null)
    assert.equal(new URL(page.url()).hash, hash)
    assert.ok((await page.locator(hash).boundingBox()).y >= 100)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: documentation column geometry stays at the recorded baseline`, { timeout: 180000 }, async () => {
  const baseline = JSON.parse(await readFile(new URL('../test-results/interior-redesign/document-baseline/geometry.json', import.meta.url), 'utf8'))
  const entries = Array.isArray(baseline) ? baseline : baseline.results
  for (const entry of entries) {
    const { context, page } = await open(entry.path, { width: entry.width })
    try {
      const actual = await page.evaluate(() => Object.fromEntries(Object.entries({ article: 'article.prose', sidebar: '#sidebar', contents: '.doc-page-contents' }).map(([key, selector]) => {
        const element = document.querySelector(selector)
        if (!element?.getClientRects().length) return [key, null]
        const rect = element.getBoundingClientRect()
        return [key, { x: rect.x, width: rect.width }]
      })))
      const expected = entry.columns ?? entry
      for (const key of ['article', 'sidebar', 'contents']) assert.deepEqual(actual[key], expected[key], `${entry.width} ${entry.path} ${key}`)
    } finally { await context.close() }
  }
})

for (const locale of ['en', 'tw']) test(`${browserName} ${locale}: sponsor tier destinations, modal dismissal and focus`, { timeout: 120000 }, async () => {
  const { context, page, errors } = await open(`${locale === 'tw' ? '/tw' : ''}/sponsor`)
  try {
    const tiers = page.locator('.sponsor-tier')
    assert.equal(await tiers.count(), 8)
    const ids = ['117592', '117593', '117594', null, '117586', '117585', '117584', '117588']
    for (let i = 0; i < 8; i++) {
      const tier = tiers.nth(i)
      await tier.click()
      const dialog = page.locator('dialog.site-modal')
      await dialog.waitFor()
      const links = await dialog.locator('a').evaluateAll(elements => elements.map(element => element.href))
      assert.equal(links.length, 2)
      assert.ok(links[0].startsWith('https://opencollective.com/master-co/'))
      assert.ok(links[1].startsWith('https://github.com/sponsors/master-co/sponsorships?'))
      if (ids[i]) assert.equal(new URL(links[1]).searchParams.get('tier_id'), ids[i])
      else assert.equal(new URL(links[1]).searchParams.get('amount'), '3')
      const close = dialog.getByRole('button', { name: locale === 'tw' ? '關閉視窗' : 'Close dialog' })
      await close.focus(); await page.keyboard.press('Shift+Tab')
      // Native dialogs may send Tab to browser chrome; background page controls stay inert.
      assert.equal(await dialog.evaluate(element => element.matches(':modal') && (document.activeElement === document.body || element.contains(document.activeElement))), true)
      if (i === 0) await close.click()
      else if (i === 1) await page.mouse.click(2, 2)
      else await page.keyboard.press('Escape')
      assert.equal(await dialog.count(), 0)
      assert.equal(await tier.evaluate(element => element === document.activeElement), true)
    }
    await noOverflow(page)
    await page.setViewportSize({ width: 320, height: 900 })
    await page.addStyleTag({ content: 'html{font-size:32px!important}' })
    await noOverflow(page)
    await tiers.nth(4).click()
    await noOverflow(page, '.site-modal')
    const summary = page.locator('.sponsor-tier-modal-summary')
    const heading = summary.locator('strong')
    const typography = await heading.evaluate(element => ({ height: element.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(element).lineHeight) }))
    assert.ok(typography.height <= typography.lineHeight * 2 + 1, 'the tier name stays readable instead of wrapping letter by letter')
    assert.ok((await summary.locator('.sponsor-tier-copy').boundingBox()).width >= 160, 'the enlarged tier retains room for its amount and interval')
    await noOverflow(page, '.site-modal-content')
    await page.screenshot({ path: new URL(`${locale}-sponsor-enlarged.png`, output).pathname })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: sponsor platform links remain available without JavaScript`, { timeout: 60000 }, async () => {
  const { context, page } = await open('/sponsor', { js: false, width: 320 })
  try {
    assert.equal(await page.locator('.sponsor-static-links a').count(), 16)
    assert.equal(await page.locator('.sponsor-static-links').first().isVisible(), true)
    assert.equal(await page.locator('.sponsor-tier:visible').count(), 0, 'enhancement-only buttons yield to real platform links')
    assert.equal(await page.locator('.sponsor-static-tier .sponsor-tier-amount').count(), 8, 'the static view retains each amount or flexible option')
    await noOverflow(page)
  } finally { await context.close() }
})

for (const route of ['/blog', '/tw/blog', '/404', '/tw/404']) test(`${browserName}: ${route} has a usable narrow and enlarged view`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open(route, { width: 320, scheme: 'dark' })
  try {
    assert.equal(await page.locator('h1').count(), 1)
    await noOverflow(page)
    await page.addStyleTag({ content: 'html{font-size:32px!important}' })
    await noOverflow(page)
    if (route.endsWith('/404')) {
      const target = await page.locator('.not-found-guide').getAttribute('href')
      // Static hosting serves the same 404 HTML fallback to unknown locales.
      const language = await page.locator('html').getAttribute('lang')
      assert.equal(target, language.startsWith('zh') ? '/tw/guide' : '/guide')
      await page.locator('.not-found-search').click()
      const search = page.getByRole('dialog')
      const query = search.getByRole('combobox')
      await query.pressSequentially('padding')
      assert.equal(await search.evaluate(element => element.matches(':modal')), true, 'a visible search has entered the native modal state')
      await search.getByRole('option').first().waitFor()
      assert.equal(await query.inputValue(), 'padding', 'initial typing survives the dialog opening and index loading')
      await page.keyboard.press('Escape')
      assert.equal(await page.locator('.not-found-search').evaluate(element => element === document.activeElement), true)
    } else assert.equal(await page.locator('.blog-post-link').count(), 2)
    await page.screenshot({ path: new URL(`${route.replaceAll('/', '-')}-320-enlarged.png`, output).pathname, fullPage: true })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: enlarged Blog article titles and author links remain fully readable at 320px`, { timeout: 90000 }, async () => {
  for (const locale of ['', '/tw']) for (const slug of ['master-css-next', 'bootstrapping-master-css-with-vite']) {
    const { context, page, errors } = await open(`${locale}/blog/${slug}`, { width: 320, scheme: 'dark' })
    try {
      const title = await page.locator('h1').innerText()
      await page.addStyleTag({ content: 'html{font-size:32px!important}' })
      await page.evaluate(() => document.fonts.ready)
      await noOverflow(page)
      assert.equal(await page.locator('h1').innerText(), title, 'the complete title remains in the reading flow')
      const author = page.getByRole('link', { name: /Aron @aron1tw/ }).first()
      const box = await author.boundingBox()
      assert.ok(box.x >= 0 && box.x + box.width <= 321, 'the author link fits the page')
      assert.ok(box.height >= 44, 'the complete author link offers a standalone touch target')
      if (slug === 'master-css-next') {
        const second = await page.getByRole('link', { name: /BenSeage @benseage/ }).boundingBox()
        assert.ok(second.x >= 0 && second.x + second.width <= 321, 'the second author wraps into available space')
      }
      await page.screenshot({ path: new URL(`${locale ? 'tw' : 'en'}-${slug}-320-enlarged.png`, output).pathname })
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  }
})

test(`${browserName}: pages without a document sidebar keep a visible desktop search entry`, { timeout: 120000 }, async () => {
  for (const locale of ['', '/tw']) for (const route of ['/', '/brand', '/blog', '/sponsor', '/design-system', '/404']) {
    const { context, page, errors } = await open(locale + (route === '/' && locale ? '' : route), { width: 1024 })
    try {
      const tw = (await page.locator('html').getAttribute('lang')).startsWith('zh')
      const name = tw ? '搜尋文件' : 'Search documentation'
      const header = page.getByRole('navigation', { name: tw ? '主要導覽' : 'Main navigation', exact: true })
      assert.equal(await header.count(), 1, 'the main navigation has its actual accessible name')
      const trigger = header.getByRole('button', { name, exact: true })
      for (const width of [1024, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        assert.equal(await trigger.isVisible(), true)
        await noOverflow(page)
      }
      await trigger.click()
      const dialog = page.getByRole('dialog', { name, exact: true })
      const input = dialog.getByRole('combobox', { name, exact: true })
      await input.pressSequentially('padding')
      await dialog.getByRole('option').first().waitFor()
      await input.press('Escape')
      assert.equal(await trigger.evaluate(element => element === document.activeElement), true)
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  }
  for (const route of ['/guide/introduction', '/reference']) {
    const { context, page } = await open(route, { width: 1440 })
    try {
      const header = page.getByRole('navigation', { name: 'Main navigation', exact: true })
      assert.equal(await header.getByRole('button', { name: 'Search documentation', exact: true, includeHidden: true }).isVisible(), false)
      assert.equal(await page.locator('#sidebar').getByRole('button', { name: 'Search documentation', exact: true }).count(), 1, 'the document sidebar keeps its existing search entry')
    } finally { await context.close() }
  }
})
