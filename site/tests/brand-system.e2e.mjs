/** MASTER_BRAND_URL=http://127.0.0.1:3217 node --test site/tests/brand-system.e2e.mjs */
import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const browserName = process.env.MASTER_BRAND_BROWSER ?? 'chromium'
const full = process.env.MASTER_BRAND_MATRIX === 'full'
const base = process.env.MASTER_BRAND_URL ?? 'http://127.0.0.1:3217'
const output = new URL(`../test-results/interior-redesign/brand-${browserName}/`, import.meta.url)
let browser
before(async () => { await mkdir(output, { recursive: true }); browser = await ({ chromium, webkit })[browserName].launch() })
after(async () => { await browser?.close() })

async function open({ width = 1440, locale = 'en', scheme = 'light', motion = 'reduce', js = true, density = 1, textSize, denyCopy = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme, reducedMotion: motion, javaScriptEnabled: js, deviceScaleFactor: density })
  if (denyCopy) await context.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied') } } }))
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const response = await page.goto(`${base}${locale === 'tw' ? '/tw' : ''}/brand`, { waitUntil: 'networkidle', timeout: 60000 })
  assert.equal(response.status(), 200)
  await page.evaluate(() => document.fonts.ready)
  if (textSize) await page.addStyleTag({ content: `html { font-size: ${textSize}px !important; }` })
  return { context, page, errors }
}

async function assertLayout(page) {
  // Visit retained artwork before checking lazy images or capturing the whole guide.
  for (const image of await page.locator('.brand-downloads img').all()) await image.scrollIntoViewIfNeeded()
  await page.waitForFunction(() => [...document.querySelectorAll('.brand-page img')].every(image => image.complete && image.naturalWidth))
  await page.evaluate(() => window.scrollTo(0, 0))
  const result = await page.evaluate(() => {
    const root = document.documentElement
    const colors = [...document.querySelectorAll('.brand-color')].map(card => {
      const family = card.getAttribute('data-family')
      const paint = card.querySelector('.brand-color-paint')
      const sample = family === 'text' || family === 'line' ? paint.firstElementChild : paint
      const style = getComputedStyle(sample)
      return { token: card.getAttribute('data-token'), color: family === 'text' ? style.color : family === 'line' ? style.borderTopColor : style.backgroundColor }
    })
    return {
      overflow: root.scrollWidth > innerWidth + 1,
      missingTargets: [...document.querySelectorAll('.brand-navigation a[href^="#"]')].filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash),
      colors,
      brokenArtwork: [...document.querySelectorAll('.brand-page img')].filter(img => !img.complete || !img.naturalWidth).map(img => img.getAttribute('src')),
      headingBounds: [...document.querySelectorAll('.brand-hero h1,.brand-content > h2')].map(element => ({ left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right })),
    }
  })
  assert.equal(result.overflow, false, 'the page keeps horizontal overflow local')
  assert.deepEqual(result.missingTargets, [])
  assert.deepEqual(result.brokenArtwork, [])
  assert.equal(result.colors.length, 21)
  for (const entry of result.colors) assert.ok(entry.color !== 'rgba(0, 0, 0, 0)' && entry.color !== 'transparent', `${entry.token}: a real rendered color`)
  for (const bounds of result.headingBounds) { assert.ok(bounds.left >= -1); assert.ok(bounds.right <= (await page.viewportSize()).width + 1) }
}

for (const width of full ? [320, 390, 768, 1280, 1440] : [390, 1440]) {
  for (const locale of full ? ['en', 'tw'] : ['en']) for (const scheme of ['light', 'dark']) {
    test(`${browserName} ${width} ${locale} ${scheme}: complete identity and working links`, { timeout: 90000 }, async () => {
      const { context, page, errors } = await open({ width, locale, scheme })
      try {
        assert.equal(await page.locator('h1').count(), 1)
        await assertLayout(page)
        const assets = await page.locator('.brand-downloads a[download]').evaluateAll(links => links.map(link => link.getAttribute('href')))
        assert.deepEqual(assets, ['/images/css-logotype@dark.svg', '/images/css-logotype@light.svg', '/images/logo.svg'])
        await page.screenshot({ path: new URL(`${width}-${locale}-${scheme}.png`, output).pathname, fullPage: true })
        assert.deepEqual(errors, [])
      } finally { await context.close() }
    })
  }
}

test(`${browserName}: native radios, range, disclosure and failed clipboard keep a truthful state`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open({ denyCopy: true })
  try {
    const board = page.locator('.brand-controls-board')
    const list = board.getByRole('radio', { name: 'List', exact: true })
    const grid = board.getByRole('radio', { name: 'Grid', exact: true })
    await list.focus()
    const initial = await board.boundingBox()
    await page.keyboard.press('ArrowRight')
    assert.equal(await grid.isChecked(), true)
    const positions = await board.locator('.brand-control-preview > div').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().top))
    assert.ok(Math.abs(positions[0] - positions[2]) < 1, 'the native radio changes the actual desktop layout')
    assert.equal((await board.boundingBox()).height, initial.height)
    await page.keyboard.press('ArrowLeft')
    assert.equal(await list.isChecked(), true)
    const range = board.getByRole('slider')
    await range.focus(); await page.keyboard.press('End')
    assert.equal(await board.locator('output').textContent(), '32px')
    assert.equal(await board.locator('.brand-control-preview').evaluate(element => getComputedStyle(element).paddingTop), '32px')
    const color = page.locator('.brand-color').first()
    const colorHeight = (await color.boundingBox()).height
    const copy = color.getByRole('button')
    await copy.focus()
    await page.keyboard.press('Enter')
    assert.equal(await color.getByRole('status').textContent(), 'Copy unavailable')
    assert.equal((await color.boundingBox()).height, colorHeight, 'feedback has a reserved place')
    assert.equal(await copy.evaluate(element => element === document.activeElement), true, 'keyboard activation retains its existing focus')
    const actionSize = await board.getByRole('button', { name: 'Copy the raised surface variable' }).boundingBox()
    const disabledSize = await board.getByRole('button', { name: 'Unavailable', exact: true }).boundingBox()
    assert.equal(actionSize.height, disabledSize.height, 'feedback reservation does not stretch the neighboring action')
    assert.equal(await board.getByRole('button', { name: 'Unavailable', exact: true }).isDisabled(), true)
    await board.locator('summary').click()
    assert.equal(await board.locator('details').getAttribute('open'), '')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: minimum logo examples keep their actual dimensions and source proportions`, { timeout: 60000 }, async () => {
  const { context, page } = await open()
  try {
    const examples = page.locator('.brand-logo-minimums')
    await examples.scrollIntoViewIfNeeded()
    const mark = await examples.locator('img[src="/images/logo.svg"]').boundingBox()
    const lockup = await examples.locator('img:visible').last().boundingBox()
    assert.equal(mark.height, 16)
    assert.equal(lockup.width, 160)
    assert.ok(Math.abs(mark.width / mark.height - 103.81 / 56.36) < .001)
    assert.ok(Math.abs(lockup.width / lockup.height - 460 / 55) < .01)
    await page.screenshot({ path: new URL('minimum-logo-sizes.png', output).pathname })
  } finally { await context.close() }
})

test(`${browserName}: appearance updates real paint and mobile navigation reaches a clear heading`, { timeout: 60000 }, async () => {
  const { context, page } = await open({ width: 390 })
  try {
    const reading = page.locator('.brand-color[data-token="--color-surface-raised"] .brand-color-value')
    const before = await reading.textContent()
    await page.getByRole('combobox', { name: 'Brand appearance' }).selectOption('dark')
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'))
    await page.waitForFunction(previous => document.querySelector('.brand-color[data-token="--color-surface-raised"] .brand-color-value').textContent !== previous, before)
    const menu = page.locator('.brand-mobile-navigation')
    await menu.locator('summary').click()
    await menu.getByRole('link', { name: 'Color', exact: true }).click()
    assert.equal(await menu.getAttribute('open'), null)
    assert.ok(page.url().endsWith('#color-system'))
    const bounds = await page.locator('#color-system').boundingBox()
    assert.ok(bounds.y >= 95, 'the heading clears both fixed navigation regions')
  } finally { await context.close() }
})

test(`${browserName}: asset links download the exact original SVG files`, { timeout: 60000 }, async () => {
  const { context, page } = await open({ width: 390 })
  try {
    for (const link of await page.locator('.brand-downloads a[download]').all()) {
      const href = await link.getAttribute('href')
      const [download] = await Promise.all([page.waitForEvent('download'), link.click()])
      assert.equal(await download.failure(), null)
      const actual = await readFile(await download.path())
      const original = await readFile(new URL(`../public${href}`, import.meta.url))
      assert.ok(actual.equals(original), `${href}: no rewritten artwork`)
    }
  } finally { await context.close() }
})

test(`${browserName}: enlarged text, density, forced colors and static content stay readable`, { timeout: 120000 }, async () => {
  for (const options of [{ width: 390, textSize: 32 }, { width: 1440, density: 1.25 }, { width: 390, density: 2 }, { width: 390, js: false }]) {
    const { context, page, errors } = await open(options)
    try {
      await assertLayout(page)
      if (options.js === false) {
        const menu = page.locator('.brand-mobile-navigation')
        await menu.locator('summary').click()
        assert.ok(await menu.getByRole('link', { name: 'Logo system', exact: true }).isVisible())
        await page.locator('.brand-controls-board').getByRole('radio', { name: 'Grid', exact: true }).check()
      }
      if (options.textSize) { await page.emulateMedia({ forcedColors: 'active' }); await assertLayout(page) }
      const name = options.textSize ? 'enlarged-forced' : options.js === false ? 'static' : `density-${options.density}`
      await page.screenshot({ path: new URL(`${name}.png`, output).pathname, fullPage: true })
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  }
})

if (browserName === 'chromium') test('chromium: copying writes the exact CSS variable', { timeout: 60000 }, async () => {
  const { context, page } = await open()
  try {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const color = page.locator('.brand-color[data-token="--color-amber-40"]')
    await color.getByRole('button').click()
    await page.waitForFunction(() => document.querySelector('.brand-color[data-token="--color-amber-40"] [role="status"]').textContent === 'Copied')
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'var(--color-amber-40)')
  } finally { await context.close() }
})
