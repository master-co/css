import { expect, test, type Locator } from '@playwright/test'

async function ready(demo: Locator) {
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  await demo.locator('iframe').evaluate(async (element: HTMLIFrameElement) => { await element.contentDocument!.fonts.ready })
  return demo.frameLocator('iframe')
}

test('clear changes the actual float geometry on keyboard focus and viewport conditions', async ({ page }) => {
  await page.goto('/en/reference/clear')
  const demo = page.locator('[data-demo-case="clear#apply-conditionally"]')
  const frame = await ready(demo)
  await demo.getByLabel('Viewport', { exact: true }).fill('300')
  const target = frame.locator('[data-target]')
  await expect(target).toHaveCSS('clear', 'left')
  const before = await target.evaluate(element => element.getBoundingClientRect().top)
  await target.focus()
  await expect(target).toHaveCSS('clear', 'both')
  expect(await target.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThan(before)
  await page.keyboard.press('Tab')
  await expect(target).toHaveCSS('clear', 'left')
  await demo.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(target).toHaveCSS('clear', 'both')
  await demo.getByLabel('Viewport', { exact: true }).fill('300')
  await page.emulateMedia({ media: 'print' })
  await expect(target).toHaveCSS('clear', 'both')
})

test('box sizing matches the documented 160px and 194px outer dimensions', async ({ page }) => {
  await page.goto('/en/reference/box-sizing')
  const demo = page.locator('[data-demo-case="box-sizing#prefer-consistency-inside-components"]')
  const frame = await ready(demo)
  const widths = await frame.locator('[data-target]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width))
  expect(widths).toEqual([160, 194])
  const references = await frame.locator('[data-ui="box-size-guide"]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width))
  expect(references).toEqual([160, 160])
  const conditional = page.locator('[data-demo-case="box-sizing#apply-conditionally"]')
  const target = (await ready(conditional)).locator('[data-target]')
  await conditional.getByLabel('Viewport', { exact: true }).fill('300')
  expect(await target.evaluate(element => element.getBoundingClientRect().width)).toBe(160)
  await conditional.getByLabel('Viewport', { exact: true }).fill('900')
  expect(await target.evaluate(element => element.getBoundingClientRect().width)).toBe(194)
})

test('inline grid remains inside its paragraph and retains all four cells', async ({ page }) => {
  await page.goto('/en/reference/display')
  const demo = page.locator('[data-demo-case="display#inline-grid"]')
  const frame = await ready(demo)
  await expect(frame.locator('p > [data-target]')).toHaveCSS('display', 'inline-grid')
  await expect(frame.locator('p > [data-target] > span')).toHaveCount(4)
  await expect(frame.locator('p')).toHaveCount(1)
  const conditional = page.locator('[data-demo-case="display#apply-conditionally"]')
  const target = (await ready(conditional)).locator('[data-target]')
  await conditional.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(target).toHaveCSS('display', 'grid')
  await conditional.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(target).toHaveCSS('display', 'flex')
  await page.emulateMedia({ media: 'print' })
  await expect(target).toHaveCSS('display', 'block')
})

test('column conditions and fragmentation change real browser fragments', async ({ page }) => {
  await page.goto('/en/reference/columns')
  const columns = page.locator('[data-demo-case="columns#apply-conditionally"]')
  const target = (await ready(columns)).locator('[data-target]')
  await columns.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(target).toHaveCSS('column-count', '1')
  await columns.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(target).toHaveCSS('column-count', '3')
  await page.goto('/en/reference/break-inside')
  const demo = page.locator('[data-demo-case="break-inside#set-the-break-inside-behavior"]')
  const frame = await ready(demo)
  const fragments = await frame.locator('[data-scenario="fragmentation"] > :nth-child(2)').evaluateAll(elements => elements.map(element => element.getClientRects().length))
  expect(fragments).toEqual([2, 1])
  const conditional = page.locator('[data-demo-case="break-inside#apply-conditionally"]')
  const item = (await ready(conditional)).locator('[data-target]')
  await conditional.getByLabel('Viewport', { exact: true }).fill('300')
  expect(await item.evaluate(element => element.getClientRects().length)).toBe(2)
  await conditional.getByLabel('Viewport', { exact: true }).fill('900')
  expect(await item.evaluate(element => element.getClientRects().length)).toBe(1)
})

test('content-sized comparisons expand and shrink without a nested vertical scroll', async ({ page }) => {
  const failures: string[] = []
  page.on('pageerror', error => failures.push(error.message))
  await page.goto('/en/reference/object-fit')
  const demo = page.locator('[data-demo-case="object-fit#apply-conditionally"]')
  await ready(demo)
  const frame = demo.locator('iframe')
  await expect(frame).toHaveAttribute('data-sizing', 'content')
  for (const width of [300, 900, 300]) {
    await demo.getByLabel('Viewport', { exact: true }).fill(String(width))
    await expect.poll(() => frame.evaluate((element: HTMLIFrameElement) => {
      const document = element.contentDocument!
      return Math.abs(document.body.getBoundingClientRect().height - element.clientHeight)
    })).toBeLessThanOrEqual(1)
    expect(await frame.evaluate((element: HTMLIFrameElement) => element.contentDocument!.documentElement.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1)
  }
  expect(failures).toEqual([])
})

test('forced column breaks and spanning headings keep their documented placement', async ({ page }) => {
  for (const side of ['before', 'after']) {
    await page.goto(`/en/reference/break-${side}`)
    const demo = page.locator('[data-demo-case]').first()
    const frame = await ready(demo)
    const positions = await frame.locator('[data-ui="comparison"] > section:last-child [data-ui="tile"]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().left))
    if (side === 'before') {
      expect(positions[1]).toBeGreaterThan(positions[0])
      expect(positions[2]).toBe(positions[1])
    } else {
      expect(positions[1]).toBe(positions[0])
      expect(positions[2]).toBeGreaterThan(positions[1])
    }
  }
  await page.goto('/en/reference/column-span')
  const demo = page.locator('[data-demo-case="column-span#apply-conditionally"]')
  const heading = (await ready(demo)).locator('[data-target]')
  await demo.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(heading).toHaveCSS('column-span', 'none')
  await demo.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(heading).toHaveCSS('column-span', 'all')
  expect(await heading.evaluate(element => element.getBoundingClientRect().width)).toBe(await heading.evaluate(element => element.parentElement!.getBoundingClientRect().width))
  await page.goto('/en/reference/float')
  const floating = page.locator('[data-demo-case="float#apply-conditionally"]')
  const image = (await ready(floating)).getByRole('img')
  await floating.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(image).toHaveCSS('float', 'right')
  await page.emulateMedia({ media: 'print' })
  await expect(image).toHaveCSS('float', 'none')
})

test('paint containment clips without changing child geometry and resets on the owning panel', async ({ page }) => {
  await page.goto('/en/reference/contain')
  const demo = page.locator('[data-demo-case="contain#contain-painting"]')
  const frame = await ready(demo)
  const panels = frame.locator('[data-ui="contain"]')
  const painted = await panels.evaluateAll(elements => elements.map(element => {
    const child = element.firstElementChild!
    const rect = child.getBoundingClientRect()
    return { width: rect.width, hit: child.contains(element.ownerDocument.elementFromPoint(rect.left + 220, rect.top + 24)) }
  }))
  expect(painted).toEqual([{ width: 256, hit: true }, { width: 256, hit: false }])
  const reset = page.locator('[data-demo-case="contain#reset-containment"]')
  const target = (await ready(reset)).locator('[data-target]')
  await reset.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(target).toHaveCSS('contain', 'paint')
  await reset.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(target).toHaveCSS('contain', 'none')
})

test('visibility reserves ordinary layout space while collapse removes a table row', async ({ page }) => {
  await page.goto('/en/reference/visibility')
  const collapse = page.locator('[data-demo-case="visibility#collapse-table-rows"]')
  const frame = await ready(collapse)
  const tables = await frame.locator('table').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height))
  expect(tables[0] - tables[1]).toBeGreaterThan(30)
  expect(await frame.locator('[data-target]').evaluate(element => element.getBoundingClientRect().height)).toBe(0)
  const conditional = page.locator('[data-demo-case="visibility#apply-conditionally"]')
  const cells = (await ready(conditional)).locator('[data-ui="tile"]')
  await conditional.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(cells.nth(1)).toHaveCSS('visibility', 'hidden')
  const before = await cells.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()))
  await page.emulateMedia({ media: 'print' })
  await expect(cells.nth(1)).toHaveCSS('visibility', 'visible')
  expect(await cells.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()))).toEqual(before)
})

const flowPages = ['clear', 'float', 'display', 'box-sizing', 'columns', 'column-span', 'break-before', 'break-after', 'break-inside', 'contain', 'visibility']
for (const route of [...flowPages.map(page => `reference/${page}`), 'guide/spacing', 'guide/installation/nextjs']) {
  test(`refinement composition: ${route}`, async ({ page }, testInfo) => {
    const failures: string[] = []
    page.on('pageerror', error => failures.push(error.message))
    await page.goto(`/en/${route}`)
    const demos = page.locator('.site-demo')
    expect(await demos.count()).toBeGreaterThan(0)
    for (const [index, demo] of (await demos.all()).entries()) {
      await demo.scrollIntoViewIfNeeded()
      const frame = demo.locator('iframe[data-sizing]')
      if (await frame.count()) {
        await expect(frame).toHaveAttribute('data-ready', 'true')
        await frame.evaluate(async (element: HTMLIFrameElement) => { await element.contentDocument!.fonts.ready })
        if (await frame.getAttribute('data-sizing') === 'content') {
          await expect.poll(() => frame.evaluate((element: HTMLIFrameElement) => element.contentDocument!.documentElement.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1)
        }
      }
      await demo.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 96))
      await demo.screenshot({ path: testInfo.outputPath(`demo-${index}.png`), scale: 'css' })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    expect(failures).toEqual([])
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true, scale: 'css' })
  })
}
