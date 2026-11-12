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
    const destinations = panel => panel.locator('.documentation-index-links a').evaluateAll(links => links.map(link => link.getAttribute('href')).sort())
    const expected = await destinations(category)
    assert.ok(expected.length > 15)
    assert.deepEqual(await destinations(alphabetical), expected)
    const az = page.locator('.documentation-index-toolbar .segmented').getByRole('button', { name: 'A–Z', exact: true })
    await az.focus(); await az.press('Enter')
    assert.equal(await az.getAttribute('aria-pressed'), 'true')
    assert.equal(await alphabetical.isVisible(), true)
    assert.equal(await category.isVisible(), false)
    const letter = alphabetical.locator('.documentation-index-letters a').first()
    const hash = await letter.getAttribute('href')
    await letter.click()
    assert.equal(new URL(page.url()).hash, hash)
    assert.equal(new URL(page.url()).search, '?review=reading')
    assert.equal(await page.locator(hash).evaluate(element => element === document.activeElement), true)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForFunction(id => !document.getElementById(id).hidden, `${section}-alphabetical-index`)
    const sectionLink = page.locator('.documentation-index-directory a[href^="#"]').first()
    await sectionLink.click()
    assert.equal(await category.isVisible(), true)
    await page.goBack({ waitUntil: 'networkidle' })
    await page.waitForFunction(id => !document.getElementById(id).hidden, `${section}-alphabetical-index`)
    await page.addStyleTag({ content: 'html { font-size: 32px !important }' })
    await noOverflow(page)
    await page.locator('.documentation-index-toolbar').scrollIntoViewIfNeeded()
    await page.screenshot({ path: new URL(`${locale}-${width}-${section}-alphabetical.png`, output).pathname })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})
