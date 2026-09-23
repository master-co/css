import { expect, test } from '@playwright/test'

test('cold concurrent documents load and hydrate their actual previews', async ({ browser }, info) => {
  const errors: string[] = []
  const contexts = await Promise.all([0, 1, 2].map(() => browser.newContext({
    baseURL: process.env.DEMO_BASE_URL || 'http://127.0.0.1:4173',
    viewport: info.project.use.viewport,
    colorScheme: info.project.use.colorScheme,
  })))
  try {
    await Promise.all(contexts.map(async (context, index) => {
      const page = await context.newPage()
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      const response = await page.goto(index === 2 ? '/en/reference/clear' : '/en/design-system')
      expect(response?.ok()).toBe(true)
      await expect(page.locator('.prose h1').first()).toBeVisible()
      const previews = index === 2 ? page.locator('iframe') : page.locator('iframe:visible')
      for (const frame of (await previews.all()).slice(0, 8)) {
        await frame.scrollIntoViewIfNeeded()
        await expect(frame).toHaveAttribute('data-ready', 'true')
      }
      if (index !== 2) {
        const entry = page.locator('details.demo-recipe').first()
        await entry.locator('summary').focus()
        await entry.locator('summary').press('Enter')
        await expect(entry).toHaveAttribute('open', '')
        await expect(entry.locator('iframe')).toHaveAttribute('data-ready', 'true')
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    }))
    expect(errors).toEqual([])
  } finally { await Promise.all(contexts.map(context => context.close())) }
})

test('server document and native catalog remain usable without JavaScript', async ({ browser }, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: process.env.DEMO_BASE_URL || 'http://127.0.0.1:4173',
    viewport: info.project.use.viewport,
    colorScheme: info.project.use.colorScheme,
  })
  try {
    const page = await context.newPage()
    await page.goto('/en/design-system')
    await expect(page.locator('.prose h1').first()).toBeVisible()
    await expect(page.locator('details.demo-recipe')).toHaveCount(87)
    const entry = page.locator('details.demo-recipe').first()
    await entry.locator('summary').focus()
    await entry.locator('summary').press('Enter')
    await expect(entry).toHaveAttribute('open', '')
    await expect(entry.getByRole('link', { name: 'Read the example and source' })).toBeVisible()
    await expect(page.locator('dl[aria-label="Demo component interfaces"] dt')).toHaveCount(18)
  } finally { await context.close() }
})

test('final gallery primitives and interfaces stay readable at every profile', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/en/design-system')
  await page.evaluate(() => document.fonts.ready)
  const screenshot = { caret: 'initial' as const, scale: 'css' as const, style: 'nav.app-wrapper{visibility:hidden}' }
  const demos = page.locator('.site-demo')
  const sizes = demos.filter({ has: page.locator('.demo-title', { hasText: /^Badge sizes$/ }) })
  await expect(sizes.locator('.demo-badge')).toHaveCount(4)
  const fonts = await sizes.locator('.demo-badge').evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)))
  expect(fonts.every((value, index) => index === 0 || value > fonts[index - 1])).toBe(true)
  await sizes.screenshot({ path: info.outputPath('badge-sizes.png'), ...screenshot })
  const treatments = demos.filter({ has: page.locator('.demo-title', { hasText: /^Badge treatments$/ }) })
  await expect(treatments.locator('.demo-badge')).toHaveCount(4)
  await expect(treatments.locator('.demo-badge').first()).toHaveAttribute('data-tone', 'neutral')
  await treatments.screenshot({ path: info.outputPath('badge-treatments.png'), ...screenshot })
  for (const [index, artwork] of (await page.locator('.prose img:visible').all()).entries()) {
    await artwork.scrollIntoViewIfNeeded()
    await expect.poll(() => artwork.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
    await artwork.screenshot({ path: info.outputPath(`artwork-${index}.png`), ...screenshot })
  }
  const definitions = page.locator('dl[aria-label="Demo component interfaces"]')
  await expect(definitions.locator('dt')).toHaveCount(18)
  for (const [index, entry] of (await definitions.locator('.doc-option').all()).entries()) {
    await entry.scrollIntoViewIfNeeded()
    expect(await entry.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await entry.screenshot({ path: info.outputPath(`interface-${index}.png`), ...screenshot })
  }
  for (const group of await page.locator('.demo-catalog-group').all()) {
    for (const summary of await group.locator('summary').all()) {
      expect(await summary.locator('span').nth(1).evaluate(element => element.getBoundingClientRect().width / element.parentElement!.getBoundingClientRect().width)).toBeGreaterThan(.5)
    }
  }
  const entry = page.locator('details.demo-recipe').first()
  await entry.locator('summary').focus()
  await entry.locator('summary').press('Enter')
  await entry.locator('iframe').scrollIntoViewIfNeeded()
  await expect(entry.locator('iframe')).toHaveAttribute('data-ready', 'true')
  await entry.screenshot({ path: info.outputPath('catalog-entry.png'), ...screenshot })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})
