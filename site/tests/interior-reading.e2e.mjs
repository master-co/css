/** Exercise lookup views and the actual source carried by the refined code panels. */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { before, after, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const engine = process.env.MASTER_SITE_BROWSER ?? 'chromium'
const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3218'
const output = new URL(`../test-results/interior-redesign/reading-${engine}/`, import.meta.url)
let browser
before(async () => { await mkdir(output, { recursive: true }); browser = await ({ chromium, webkit })[engine].launch() })
after(async () => { await browser?.close() })

async function open(route, { width = 390, locale = 'en', setup, clipboard = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce', hasTouch: width < 768, permissions: clipboard ? ['clipboard-read', 'clipboard-write'] : [] })
  if (setup) await context.addInitScript(setup)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const response = await page.goto(base + (locale === 'tw' ? '/tw' : '') + route, { waitUntil: 'networkidle', timeout: 60000 })
  assert.equal(response.status(), 200)
  await page.evaluate(() => document.fonts.ready)
  return { context, page, errors }
}

async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true)
}

for (const section of ['guide', 'reference']) for (const locale of ['en', 'tw']) for (const width of [320, 1440]) test(`${engine} ${locale} ${width}: ${section} category and alphabetical views keep the same complete inventory`, { timeout: 90000 }, async () => {
  const { context, page, errors } = await open(`/${section}?review=reading`, { width, locale })
  try {
    const category = page.locator(`#${section}-category-index`)
    const alphabetical = page.locator(`#${section}-alphabetical-index`)
    const destinations = panel => panel.locator('.doc-index-links a').evaluateAll(links => links.map(link => link.getAttribute('href')).sort())
    const expected = await destinations(category)
    assert.ok(expected.length > 30)
    assert.deepEqual(await destinations(alphabetical), expected)
    const az = page.locator('.doc-index-view').getByRole('button', { name: 'A–Z', exact: true })
    await az.focus(); await az.press('Enter')
    assert.equal(await az.getAttribute('aria-pressed'), 'true')
    assert.equal(await alphabetical.isVisible(), true)
    assert.equal(await category.isVisible(), false)
    const letter = alphabetical.locator('.doc-index-letters a').first()
    const hash = await letter.getAttribute('href')
    await letter.click()
    assert.equal(new URL(page.url()).hash, hash)
    assert.equal(new URL(page.url()).search, '?review=reading')
    assert.equal(await page.locator(hash).evaluate(element => element === document.activeElement), true)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForFunction(id => !document.getElementById(id).hidden, `${section}-alphabetical-index`)
    const sectionLink = page.locator('.doc-index-sections a[href^="#"]').first()
    await sectionLink.click()
    assert.equal(await category.isVisible(), true)
    await page.goBack({ waitUntil: 'networkidle' })
    await page.waitForFunction(id => !document.getElementById(id).hidden, `${section}-alphabetical-index`)
    await page.addStyleTag({ content: 'html { font-size: 32px !important }' })
    await noOverflow(page)
    await page.locator('.doc-index-toolbar').scrollIntoViewIfNeeded()
    await page.screenshot({ path: new URL(`${locale}-${width}-${section}-alphabetical.png`, output).pathname })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${engine}: source tabs support arrows, Home and End with complete readable panels`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/design-system/review/code')
  try {
    const window = page.locator('section[aria-labelledby="code-languages"] .codeTabs')
    const tabs = window.getByRole('tab')
    const names = await tabs.allTextContents()
    assert.equal(names.length, 4)
    await tabs.first().focus(); await page.keyboard.press('End')
    assert.equal(await tabs.last().getAttribute('aria-selected'), 'true')
    assert.equal(await window.getByRole('tabpanel').count(), 1)
    assert.ok((await window.getByRole('tabpanel').textContent()).includes('fg-text-blue:hover@sm'))
    await page.keyboard.press('ArrowRight')
    assert.equal(await tabs.first().getAttribute('aria-selected'), 'true')
    await page.keyboard.press('ArrowLeft')
    assert.equal(await tabs.last().getAttribute('aria-selected'), 'true')
    await page.keyboard.press('Home')
    assert.equal(await tabs.first().getAttribute('aria-selected'), 'true')
    assert.equal(await tabs.first().evaluate(element => element === document.activeElement), true)
    await page.addStyleTag({ content: 'html { font-size: 32px !important }' })
    await noOverflow(page)
    await window.screenshot({ path: new URL('source-tabs-enlarged.png', output).pathname })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${engine}: package-manager selection persists across installation guides and a reload`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/guide/installation')
  try {
    const sets = page.locator('[data-code-tabs-storage-key="pm"]')
    assert.ok(await sets.count() >= 1)
    await sets.first().getByRole('tab', { name: 'bun', exact: true }).click()
    for (const set of await sets.all()) {
      assert.equal(await set.getByRole('tab', { name: 'bun', exact: true }).getAttribute('aria-selected'), 'true')
      assert.ok((await set.getByRole('tabpanel').textContent()).includes('bun'))
    }
    await page.reload({ waitUntil: 'networkidle' })
    for (const set of await sets.all()) assert.equal(await set.getByRole('tab', { name: 'bun', exact: true }).getAttribute('aria-selected'), 'true')
    await page.goto(base + '/guide/installation/astro', { waitUntil: 'networkidle' })
    assert.ok(await sets.count() >= 1)
    for (const set of await sets.all()) {
      assert.equal(await set.getByRole('tab', { name: 'bun', exact: true }).getAttribute('aria-selected'), 'true')
      assert.ok((await set.getByRole('tabpanel').textContent()).includes('bun'))
    }
    await noOverflow(page)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${engine}: pending code copying keeps the original source and prevents duplicate requests`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/design-system/review/code', { setup: () => {
    window.codeWrites = []
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: value => {
      window.codeWrites.push(value)
      return new Promise(resolve => { window.finishCodeCopy = resolve })
    } } })
  } })
  try {
    const window = page.locator('section[aria-labelledby="code-current"] .codeTabs')
    const button = window.locator('[data-code-copy]')
    const initialName = await button.getAttribute('data-code-copy')
    const source = await window.getByRole('tabpanel').locator('.line').evaluateAll(lines => lines.map(line => line.textContent.replace(/[\t ]+$/u, '')).join('\n'))
    const initialHeight = (await window.boundingBox()).height
    await button.click()
    await window.getByRole('status').filter({ hasText: `Copying ${initialName}…` }).waitFor()
    assert.equal(await button.getAttribute('aria-busy'), 'true')
    assert.equal((await window.boundingBox()).height, initialHeight, 'pending feedback does not move the source panel')
    await button.click()
    assert.deepEqual(await page.evaluate(() => window.codeWrites), [source])
    await window.getByRole('tab').last().click()
    await page.evaluate(() => window.finishCodeCopy())
    await page.waitForFunction(({ element, name }) => element.textContent === `${name} copied`, { element: await window.getByRole('status').elementHandle(), name: initialName })
    assert.equal(await button.getAttribute('aria-busy'), null)
    await page.addStyleTag({ content: 'html { font-size: 32px !important }' })
    await button.click()
    await page.screenshot({ path: new URL('copy-pending-enlarged.png', output).pathname })
    await noOverflow(page)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${engine}: a failed code copy exposes selectable source and visible recovery feedback`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/design-system/review/code', { width: 320, setup: () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Clipboard denied')) } })
  } })
  try {
    const window = page.locator('section[aria-labelledby="code-current"] .codeTabs')
    await window.locator('[data-code-copy]').click()
    const status = window.getByRole('status')
    await status.filter({ hasText: 'Clipboard unavailable. Select the code to copy it.' }).waitFor()
    assert.equal(await status.getAttribute('data-error'), '')
    assert.ok((await status.boundingBox()).width > 100)
    assert.ok((await window.getByRole('tabpanel').locator('.line').count()) > 0)
    await page.screenshot({ path: new URL('copy-denied-320.png', output).pathname })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

if (engine === 'chromium') test('chromium: native code copying writes the exact selected panel', { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/design-system/review/code', { clipboard: true })
  try {
    const window = page.locator('section[aria-labelledby="code-languages"] .codeTabs')
    await window.getByRole('tab', { name: 'settings.json', exact: true }).click()
    const source = await window.getByRole('tabpanel').locator('.line').evaluateAll(lines => lines.map(line => line.textContent.replace(/[\t ]+$/u, '')).join('\n'))
    await window.locator('[data-code-copy]').click()
    await window.getByRole('status').filter({ hasText: 'settings.json copied' }).waitFor()
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), source)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})
