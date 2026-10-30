/** MASTER_SITE_URL=http://127.0.0.1:3217 node --test site/tests/documentation-search.e2e.mjs */
import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { before, after, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const browserName = process.env.MASTER_SITE_BROWSER ?? 'chromium'
const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3217'
const output = new URL(`../test-results/interior-redesign/search-${browserName}/`, import.meta.url)
let browser
before(async () => { await mkdir(output, { recursive: true }); browser = await ({ chromium, webkit })[browserName].launch() })
after(async () => { await browser?.close() })

async function open({ width = 1440, locale = 'en', scheme = 'light', route = '/guide/introduction', intercept } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const requests = []
  const errors = []
  page.on('request', request => { if (/\/search\/(?:en|tw)\.json$/.test(request.url())) requests.push(request.url()) })
  page.on('pageerror', error => errors.push(error.message))
  if (intercept) await intercept(page)
  const response = await page.goto(`${base}${locale === 'tw' ? '/tw' : ''}${route}`, { waitUntil: 'networkidle', timeout: 60000 })
  assert.equal(response.status(), 200)
  await page.evaluate(() => document.fonts.ready)
  return { context, page, requests, errors }
}

for (const width of [390, 768, 1440]) for (const locale of ['en', 'tw']) for (const scheme of ['light', 'dark']) {
  test(`${browserName} ${width} ${locale} ${scheme}: keyboard lookup, query retention and focus restoration`, { timeout: 60000 }, async () => {
    const { context, page, requests, errors } = await open({ width, locale, scheme })
    try {
      assert.equal(requests.length, 0, 'the index is fetched when search is requested')
      const name = locale === 'tw' ? '搜尋文件' : 'Search documentation'
      const trigger = page.getByRole('button', { name, exact: true }).first()
      await trigger.click()
      const dialog = page.getByRole('dialog', { name, exact: true })
      const input = dialog.getByRole('combobox', { name, exact: true })
      await input.fill('padding')
      await dialog.getByRole('option').first().waitFor()
      assert.equal(requests.length, 1)
      assert.equal(await input.evaluate(element => element === document.activeElement), true)
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'hidden')
      const first = await input.getAttribute('aria-activedescendant')
      await input.press('ArrowDown')
      const next = await input.getAttribute('aria-activedescendant')
      if (await dialog.getByRole('option').count() > 1) assert.notEqual(next, first)
      assert.equal(await dialog.locator(`#${next}`).getAttribute('aria-selected'), 'true')
      assert.ok((await dialog.locator(`#${next}`).getAttribute('href')).startsWith(locale === 'tw' ? '/tw/' : '/'))
      await page.screenshot({ path: new URL(`${width}-${locale}-${scheme}.png`, output).pathname })
      await input.press('Escape')
      assert.equal(await page.getByRole('dialog').count(), 0, 'one Escape closes the dialog')
      assert.equal(await trigger.evaluate(element => element === document.activeElement), true)
      await trigger.click()
      assert.equal(await page.getByRole('combobox', { name, exact: true }).inputValue(), 'padding')
      assert.equal(requests.length, 1, 'reopening reuses the loaded index')
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  })
}

test(`${browserName}: a failed index has an in-place retry and a clear loading state`, { timeout: 60000 }, async () => {
  let attempts = 0
  const data = await readFile(new URL('../public/search/en.json', import.meta.url), 'utf8')
  const { context, page, errors } = await open({ intercept: async page => {
    await page.route('**/search/en.json', route => {
      attempts++
      return attempts === 1 ? route.fulfill({ status: 503, body: 'Unavailable' }) : route.fulfill({ status: 200, contentType: 'application/json', body: data })
    })
  } })
  try {
    await page.getByRole('button', { name: 'Search documentation', exact: true }).first().click()
    const dialog = page.getByRole('dialog')
    const retry = dialog.getByRole('button', { name: 'Try again', exact: true })
    await retry.waitFor()
    assert.ok((await dialog.getByRole('status').textContent()).includes('could not load'))
    await retry.click()
    const input = dialog.getByRole('combobox')
    await input.fill('padding')
    await dialog.getByRole('option').first().waitFor()
    assert.equal(attempts, 2)
    assert.equal(await input.evaluate(element => element === document.activeElement), true)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: pending content is announced, empty queries are useful and Enter follows the native destination`, { timeout: 60000 }, async () => {
  let release
  const pending = new Promise(resolve => { release = resolve })
  const { context, page } = await open({ intercept: async page => {
    await page.route('**/search/en.json', async route => { await pending; await route.continue() })
  } })
  try {
    await page.keyboard.press('ControlOrMeta+k')
    const dialog = page.getByRole('dialog')
    assert.ok((await dialog.getByRole('status').textContent()).includes('Loading documentation'))
    assert.equal(await dialog.getByText('No matching documents', { exact: true }).count(), 0)
    release()
    await dialog.getByRole('button', { name: 'padding', exact: false }).first().waitFor()
    const input = dialog.getByRole('combobox')
    await input.fill('zzzz-nonexistent-brand-lookup-zzzz')
    await dialog.getByText('No matching documents', { exact: true }).waitFor()
    await input.fill('padding')
    await dialog.getByRole('option').first().waitFor()
    const target = await dialog.getByRole('option').first().getAttribute('href')
    await Promise.all([page.waitForURL(url => url.pathname + url.hash === target), input.press('Enter')])
    assert.equal(await page.getByRole('dialog').count(), 0)
  } finally { release(); await context.close() }
})

test(`${browserName}: 200% text and pointer dismissal preserve the page position`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open()
  try {
    await page.evaluate(() => window.scrollTo(0, 500))
    const scroll = await page.evaluate(() => scrollY)
    await page.keyboard.press('ControlOrMeta+k')
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('combobox').fill('padding')
    await dialog.getByRole('option').first().waitFor()
    await page.addStyleTag({ content: 'html{font-size:32px!important}' })
    const result = await dialog.evaluate(element => ({ scroll: element.scrollWidth, width: element.clientWidth, box: element.getBoundingClientRect().toJSON(), viewport: innerWidth }))
    assert.ok(result.scroll <= result.width + 1)
    assert.ok(result.box.right <= result.viewport + 1)
    await page.mouse.click(5, 5)
    assert.equal(await page.getByRole('dialog').count(), 0)
    assert.ok(Math.abs((await page.evaluate(() => scrollY)) - scroll) <= 1)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

for (const locale of ['en', 'tw']) test(`${browserName} ${locale}: 320px with 200% text keeps the query visible`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open({ width: 320, locale })
  try {
    await page.addStyleTag({ content: 'html{font-size:32px!important}' })
    await page.keyboard.press('ControlOrMeta+k')
    const dialog = page.getByRole('dialog')
    const input = dialog.getByRole('combobox')
    await input.fill('padding')
    await dialog.getByRole('option').first().waitFor()
    assert.ok((await input.boundingBox()).width >= 128, 'the typed query retains usable space beside the clear action')
    const clear = dialog.getByRole('button', { name: locale === 'tw' ? '清除搜尋' : 'Clear search' })
    const close = dialog.getByRole('button', { name: locale === 'tw' ? '關閉搜尋' : 'Close search' })
    assert.ok((await close.boundingBox()).y > (await input.boundingBox()).y, 'the secondary close action uses the next row')
    await page.screenshot({ path: new URL(`320-${locale}-enlarged-query.png`, output).pathname })
    await clear.click()
    assert.equal(await input.inputValue(), '')
    assert.equal(await input.evaluate(element => element === document.activeElement), true)
    const dimensions = await dialog.evaluate(element => ({ width: element.clientWidth, content: element.scrollWidth }))
    assert.ok(dimensions.content <= dimensions.width + 1)
    await page.screenshot({ path: new URL(`320-${locale}-enlarged.png`, output).pathname })
    await close.click()
    assert.equal(await dialog.count(), 0)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: an opening search stays hidden until its native modal boundary exists`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open({ width: 320, intercept: async page => {
    await page.addInitScript(() => {
      const showModal = HTMLDialogElement.prototype.showModal
      HTMLDialogElement.prototype.showModal = function () {
        if (this.classList.contains('documentation-search')) window.finishOpeningSearch = () => showModal.call(this)
        else showModal.call(this)
      }
    })
  } })
  try {
    await page.addStyleTag({ content: 'html{font-size:32px!important}' })
    const trigger = page.getByRole('button', { name: 'Search documentation', exact: true }).first()
    await trigger.click()
    await page.waitForFunction(() => typeof window.finishOpeningSearch === 'function')
    const dialog = page.locator('.documentation-search')
    assert.equal(await dialog.isVisible(), false, 'closed native markup cannot expose a premature input')
    await page.evaluate(() => window.finishOpeningSearch())
    const input = dialog.getByRole('combobox')
    await input.fill('padding')
    await dialog.getByRole('option').first().waitFor()
    assert.equal(await dialog.evaluate(element => element.matches(':modal')), true)
    assert.equal(await input.inputValue(), 'padding')
    await page.keyboard.press('Escape')
    assert.equal(await trigger.evaluate(element => element === document.activeElement), true)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})
