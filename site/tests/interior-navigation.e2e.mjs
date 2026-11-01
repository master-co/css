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

async function open(route, { width = 390, scheme = 'light', js = true, touch = false, motion = 'reduce' } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: motion, javaScriptEnabled: js, hasTouch: touch })
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
      assert.equal(await page.locator('.ui-not-found .ui-search-trigger').count(), 1)
      assert.equal(await page.locator('.ui-not-found > a.ui-button').count(), 1)
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
      assert.ok(await menu.locator('.ui-sidebar a').count() > 15, 'the menu carries the section\'s complete chapter list')
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
      await noOverflow(page, 'dialog.ui-dialog[data-variant="sheet"]')
      await page.screenshot({ path: new URL(`${width}-${section}-menu.png`, output).pathname })
      await page.keyboard.press('Escape')
      assert.equal(await page.getByRole('dialog').count(), 0)
      assert.equal(await trigger.evaluate(element => element === document.activeElement), true)
      await trigger.click()
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.waitForFunction(() => !document.querySelector('dialog.ui-dialog[data-variant="sheet"]'))
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY !== 'hidden'), true)
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  })
}

test(`${browserName}: language changes retain a document query and semantic anchor`, { timeout: 60000 }, async () => {
  const { context, page } = await open('/guide/introduction?source=brand#what-is-master-css')
  try {
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    const select = page.locator('.ui-dialog-fields label').filter({ hasText: 'Language' }).locator('select')
    await Promise.all([page.waitForURL(url => url.pathname === '/tw/guide/introduction'), select.selectOption('tw')])
    const url = new URL(page.url())
    assert.equal(url.search, '?source=brand')
    assert.equal(url.hash, '#what-is-master-css')
    assert.equal(await page.getByRole('dialog').count(), 0)
    assert.equal(await page.getByRole('link', { name: 'Master CSS 首頁', exact: true }).count(), 1)
    const tracking = await page.locator('article.ui-prose :is(h1,h2,h3)').evaluateAll(headings => headings.map(heading => getComputedStyle(heading).letterSpacing))
    assert.ok(tracking.every(value => value === 'normal' || parseFloat(value) === 0), 'the localized document keeps natural heading tracking')
  } finally { await context.close() }
})

test(`${browserName}: a contents jump creates one history entry and modified clicks keep native navigation`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/guide/introduction?source=brand', { width: 1440 })
  try {
    const original = page.url()
    const history = await page.evaluate(() => window.history.length)
    const link = page.locator('nav.ui-toc[data-rail] a[href^="#"]').nth(1)
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
    await noOverflow(page, 'dialog.ui-dialog[data-variant="sheet"]')
    await page.locator('.ui-dialog-fields').scrollIntoViewIfNeeded()
    await page.screenshot({ path: new URL('320-tw-enlarged-menu.png', output).pathname })
    await page.keyboard.press('Escape')
    await noOverflow(page)
    const contents = page.locator('details[data-contents-disclosure]')
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
      const actual = await page.evaluate(() => Object.fromEntries(Object.entries({ article: 'article.ui-prose', sidebar: '#sidebar', contents: 'nav.ui-toc[data-rail]' }).map(([key, selector]) => {
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

for (const route of ['/blog', '/tw/blog', '/404', '/tw/404']) test(`${browserName}: ${route} has a usable narrow and enlarged view`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open(route, { width: 320, scheme: 'dark' })
  try {
    assert.equal(await page.locator('h1').count(), 1)
    await noOverflow(page)
    await page.addStyleTag({ content: 'html{font-size:32px!important}' })
    await noOverflow(page)
    if (route.endsWith('/404')) {
      const target = await page.locator('.ui-not-found > a.ui-button').getAttribute('href')
      // Static hosting serves the same 404 HTML fallback to unknown locales.
      const language = await page.locator('html').getAttribute('lang')
      assert.equal(target, language.startsWith('zh') ? '/tw/guide' : '/guide')
      await page.locator('.ui-not-found .ui-search-trigger').click()
      const search = page.getByRole('dialog')
      const query = search.getByRole('combobox')
      await query.pressSequentially('padding')
      assert.equal(await search.evaluate(element => element.matches(':modal')), true, 'a visible search has entered the native modal state')
      await search.getByRole('option').first().waitFor()
      assert.equal(await query.inputValue(), 'padding', 'initial typing survives the dialog opening and index loading')
      await page.keyboard.press('Escape')
      assert.equal(await page.locator('.ui-not-found .ui-search-trigger').evaluate(element => element === document.activeElement), true)
    } else assert.equal(await page.locator('.blog-entry-link').count(), 2)
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
      const author = page.getByRole('link', { name: /^Aron\b/ }).first()
      const box = await author.boundingBox()
      assert.ok(box.x >= 0 && box.x + box.width <= 321, 'the author link fits the page')
      assert.ok(box.height >= 44, 'the complete author link offers a standalone touch target')
      if (slug === 'master-css-next') {
        const second = await page.getByRole('link', { name: /^BenSeage\b/ }).boundingBox()
        assert.ok(second.x >= 0 && second.x + second.width <= 321, 'the second author wraps into available space')
      }
      await page.screenshot({ path: new URL(`${locale ? 'tw' : 'en'}-${slug}-320-enlarged.png`, output).pathname })
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  }
})

test(`${browserName}: pages without a document sidebar keep a visible desktop search entry`, { timeout: 120000 }, async () => {
  // The homepage is left out: its compact header hides the search entry on desktop by design (data-compact).
  for (const locale of ['', '/tw']) for (const route of ['/brand', '/blog', '/design-system', '/404']) {
    const { context, page, errors } = await open(locale + route, { width: 1024 })
    try {
      const tw = (await page.locator('html').getAttribute('lang')).startsWith('zh')
      const name = tw ? '搜尋文件' : 'Search documentation'
      assert.equal(await page.getByRole('navigation', { name: tw ? '主要導覽' : 'Main navigation', exact: true }).count(), 1, 'the main navigation has its actual accessible name')
      const header = page.locator('header.ui-header')
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
      const header = page.locator('header.ui-header')
      assert.equal(await header.getByRole('button', { name: 'Search documentation', exact: true, includeHidden: true }).isVisible(), false)
      assert.equal(await page.locator('#sidebar').getByRole('button', { name: 'Search documentation', exact: true }).count(), 1, 'the document sidebar keeps its existing search entry')
    } finally { await context.close() }
  }
})

test(`${browserName}: tucked-away navigation reveals keyboard focus without changing the reading position`, { timeout: 90000 }, async () => {
  for (const motion of ['reduce', 'no-preference']) {
    const { context, page, errors } = await open('/blog/master-css-next', { width: 1440, motion })
    try {
      const header = page.locator('header.ui-header')
      await page.evaluate(() => scrollTo(0, 1600))
      await page.waitForFunction(element => element.getBoundingClientRect().bottom <= 1, await header.elementHandle())
      if (motion === 'reduce') assert.ok(await header.evaluate(element => getComputedStyle(element).transitionDuration.split(',').every(value => parseFloat(value) === 0)), 'reduced motion removes header travel')
      await page.keyboard.press('Tab')
      assert.equal(await header.evaluate(element => element.contains(document.activeElement)), true)
      await page.waitForFunction(element => element.getBoundingClientRect().top >= -.5, await header.elementHandle())
      assert.equal(await page.evaluate(() => scrollY), 1600, 'revealing focus keeps the current paragraph in place')
      const trigger = header.getByRole('button', { name: 'Search documentation', exact: true })
      await trigger.focus(); await trigger.press('Enter')
      const search = page.getByRole('dialog', { name: 'Search documentation', exact: true })
      await search.getByRole('combobox').press('Escape')
      assert.equal(await trigger.evaluate(element => element === document.activeElement), true)
      const box = await trigger.boundingBox()
      assert.ok(box.y >= 0 && box.y + box.height <= 900, 'focus returns to a visible search entry')
      assert.equal(await page.evaluate(() => scrollY), 1600)
      await page.screenshot({ path: new URL(`sticky-header-${motion}-keyboard.png`, output).pathname })
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  }
})
