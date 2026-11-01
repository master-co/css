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

async function open({ width = 1440, locale = 'en', scheme = 'light', js = true, density = 1, textSize } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme, reducedMotion: 'reduce', javaScriptEnabled: js, deviceScaleFactor: density })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const response = await page.goto(`${base}${locale === 'tw' ? '/tw' : ''}/brand`, { waitUntil: 'networkidle', timeout: 60000 })
  assert.equal(response.status(), 200)
  await page.evaluate(() => document.fonts.ready)
  if (textSize) await page.addStyleTag({ content: `html { font-size: ${textSize}px !important; }` })
  return { context, page, errors }
}

async function assertLayout(page, scheme) {
  // Visit lazy artwork before checking that every visible image loaded; the other theme's version stays hidden.
  for (const image of await page.locator('article img:visible').all()) await image.scrollIntoViewIfNeeded()
  await page.waitForFunction(() => [...document.querySelectorAll('article img')].filter(image => image.checkVisibility()).every(image => image.complete && image.naturalWidth))
  await page.evaluate(() => window.scrollTo(0, 0))
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    missingTargets: [...document.querySelectorAll('a[href^="#"]')].filter(link => link.hash.length > 1 && !document.getElementById(decodeURIComponent(link.hash.slice(1)))).map(link => link.hash),
    brokenArtwork: [...document.querySelectorAll('article img')].filter(img => img.checkVisibility() && (!img.complete || !img.naturalWidth)).map(img => img.getAttribute('src')),
    artwork: [...document.querySelectorAll('.brand-clearspace img, .brand-minimums img')].filter(img => img.checkVisibility()).map(img => img.getAttribute('src')),
    signal: getComputedStyle(document.querySelector('.brand-gold [data-signal]')).backgroundColor,
  }))
  assert.equal(result.overflow, false, 'the page keeps horizontal overflow local')
  assert.deepEqual(result.missingTargets, [])
  assert.deepEqual(result.brokenArtwork, [])
  assert.equal(result.artwork.length, 5, 'one version of each specimen is visible')
  for (const src of result.artwork) assert.match(src, scheme === 'dark' ? /(on-dark|@dark)\.svg$/ : /(on-light|@light)\.svg$/, `${src}: the version made for the ${scheme} background`)
  assert.ok(!['rgba(0, 0, 0, 0)', 'transparent'].includes(result.signal), 'the gold signal token is delivered and painted')
}

for (const width of full ? [320, 390, 768, 1280, 1440] : [390, 1440]) {
  for (const locale of full ? ['en', 'tw'] : ['en']) for (const scheme of ['light', 'dark']) {
    test(`${browserName} ${width} ${locale} ${scheme}: complete identity and working links`, { timeout: 90000 }, async () => {
      const { context, page, errors } = await open({ width, locale, scheme })
      try {
        assert.equal(await page.locator('h1').count(), 1)
        await assertLayout(page, scheme)
        const colors = await page.locator('header.ui-header .ui-header-brand svg:visible stop').evaluateAll(stops => stops.map(stop => stop.getAttribute('stop-color').toLowerCase()))
        assert.ok(colors.includes(scheme === 'light' ? '#fde2a7' : '#fcdd98'), 'the rendered header uses the approved background highlight')
        assert.ok(colors.includes('#e6b65d'), 'the rendered header uses the shared gold endpoint')
        const assets = await page.locator('.brand-downloads a[download], .brand-kit a[download]').evaluateAll(links => links.map(link => link.getAttribute('href')))
        assert.deepEqual(assets, ['/images/css-logotype@dark.svg', '/images/css-logotype@light.svg', '/images/logo.svg', '/brand/v2/logo/mark/master-mark-on-light.svg', '/brand/v2/logo/mark/master-mark-small-on-dark.svg', '/brand/v2/logo/mark/master-mark-small-on-light.svg', '/brand/v2/master-css-brand-kit-v2.zip'])
        await page.screenshot({ path: new URL(`${width}-${locale}-${scheme}.png`, output).pathname, fullPage: true })
        assert.deepEqual(errors, [])
      } finally { await context.close() }
    })
  }
}

test(`${browserName}: minimum sizes keep their actual dimensions and source proportions`, { timeout: 60000 }, async () => {
  const { context, page } = await open({ width: 320 })
  try {
    const sizes = await page.locator('.brand-minimums img').evaluateAll(images => images.filter(image => image.checkVisibility()).map(image => {
      const box = image.getBoundingClientRect()
      return { src: image.getAttribute('src'), width: box.width, height: box.height }
    }))
    assert.deepEqual(sizes.map(size => size.height), [16, 24, 16])
    for (const size of sizes) {
      const ratio = size.src.includes('logotype') ? 1197.53 / 130.26 : 216.6 / 120
      assert.ok(Math.abs(size.width / size.height - ratio) < .01, `${size.src}: source proportions`)
    }
    await page.locator('.brand-minimums').screenshot({ path: new URL('minimum-logo-sizes.png', output).pathname })
  } finally { await context.close() }
})

test(`${browserName}: asset links download the exact approved SVG files and ZIP kit`, { timeout: 60000 }, async () => {
  const { context, page } = await open({ width: 390 })
  try {
    for (const link of await page.locator('.brand-downloads a[download], .brand-kit a[download]').all()) {
      const href = await link.getAttribute('href')
      const [download] = await Promise.all([page.waitForEvent('download'), link.click()])
      assert.equal(await download.failure(), null)
      const actual = await readFile(await download.path())
      const original = await readFile(new URL(`../public${href}`, import.meta.url))
      assert.ok(actual.equals(original), `${href}: no rewritten artwork`)
    }
  } finally { await context.close() }
})

test(`${browserName}: the portable guide serves the complete brand content`, { timeout: 60000 }, async () => {
  const { context, page } = await open()
  try {
    const response = await page.request.get(`${base}/brand.md`)
    assert.equal(response.status(), 200)
    const markdown = await response.text()
    assert.ok(markdown.startsWith('# Brand\n'))
    for (const text of ['Canonical: /brand', 'Language: English', 'Half the mark\'s height', '--color-amber-40', 'Noto Sans TC', '在標記中編寫樣式', '/images/css-logotype@dark.svg', 'trademarks owned by Aoyue Design']) assert.ok(markdown.includes(text), text)
    assert.doesNotMatch(markdown, /<Brand[A-Z]|MCSS_EXPRESSION/)
    assert.equal(await page.getByRole('link', { name: 'read this page as Markdown' }).getAttribute('href'), '/brand.md')
  } finally { await context.close() }
})

test(`${browserName}: enlarged text, density, forced colors and static content stay readable`, { timeout: 120000 }, async () => {
  for (const options of [{ width: 390, textSize: 32 }, { width: 320, locale: 'tw', textSize: 32 }, { width: 1440, density: 1.25 }, { width: 390, density: 2 }, { width: 390, js: false }, { width: 390, scheme: 'dark', js: false }]) {
    const { context, page, errors } = await open(options)
    try {
      await assertLayout(page, options.scheme ?? 'light')
      if (options.textSize) {
        await page.emulateMedia({ forcedColors: 'active' })
        assert.equal(await page.evaluate(() => matchMedia('(forced-colors: active)').matches), true, 'the forced-color scene exercises the actual media condition')
        await assertLayout(page, options.scheme ?? 'light')
      }
      const name = options.textSize ? `${options.width}-${options.locale ?? 'en'}-enlarged-forced` : options.js === false ? `static-${options.scheme ?? 'light'}` : `density-${options.density}`
      await page.screenshot({ path: new URL(`${name}.png`, output).pathname, fullPage: options.locale !== 'tw' })
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  }
})
