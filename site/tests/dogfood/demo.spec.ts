import { expect, test } from '@playwright/test'
import { readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('clear preserves side-specific float geometry', async ({ page }, testInfo) => {
  await page.goto('/en/reference/clear')
  for (const side of ['both-left-and-right', 'left', 'right']) {
    const demo = page.locator(`[data-demo-case="clear#clearing-${side}-floats"]`)
    await demo.scrollIntoViewIfNeeded()
    const frame = demo.locator('iframe')
    await expect(frame).toBeVisible()
    await expect.poll(async () => frame.evaluate((element: HTMLIFrameElement) => {
      const children = element.contentDocument?.querySelector('[data-ui="float-context"]')?.children
      if (!children?.length) return null
      return [...children].map(child => {
        const rect = child.getBoundingClientRect()
        return { top: rect.top, bottom: rect.bottom }
      })
    })).not.toBeNull()
    const bounds = await frame.evaluate((element: HTMLIFrameElement) => [...element.contentDocument!.querySelector('[data-ui="float-context"]')!.children].map(child => {
      const rect = child.getBoundingClientRect()
      return { top: rect.top, bottom: rect.bottom }
    }))
    const [left, right, target] = bounds
    expect(target.top).toBeGreaterThanOrEqual(side === 'left' ? left.bottom : side === 'right' ? right.bottom : Math.max(left.bottom, right.bottom))
    if (side === 'left') expect(target.top).toBeLessThan(right.bottom)
    if (side === 'right') expect(target.top).toBeLessThan(left.bottom)
  }
  await page.screenshot({ path: testInfo.outputPath('clear.png'), fullPage: true, caret: 'initial' })
})

test('design system is responsive and its controls change real layout', async ({ page }, testInfo) => {
  const failures: string[] = []
  page.on('pageerror', error => failures.push(error.stack || error.message))
  await page.goto('/en/design-system')
  await expect(page.locator('h2#foundations')).toBeVisible()
  const controls = page.getByRole('group', { name: 'Cross-axis alignment' })
  await controls.getByRole('button', { name: 'end', exact: true }).click()
  await expect(controls.getByRole('button', { name: 'end', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[class~="items-end"]').first()).toHaveCSS('align-items', 'end')
  const measure = page.locator('.demo-measure output[aria-label="Container dimensions"]')
  const viewport = page.viewportSize()!
  await expect(measure).toHaveText(/\d+ × \d+ px/)
  const originalMeasure = await measure.textContent()
  await page.setViewportSize({ ...viewport, width: Math.max(320, Math.floor(viewport.width / 2)) })
  await expect(measure).not.toHaveText(originalMeasure!)
  await page.setViewportSize(viewport)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  expect(overflow).toBe(false)
  expect(failures).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('design-system.png'), fullPage: true, caret: 'initial' })
})

test('iframe controls resize the actual viewport and expose accessible controls', async ({ page }) => {
  await page.goto('/en/reference/screen-readers')
  const first = page.locator('[data-demo-case]').first()
  await first.scrollIntoViewIfNeeded()
  const frame = first.frameLocator('iframe')
  await expect(frame.locator('summary')).toBeVisible()
  await expect(frame.locator('summary')).toHaveAccessibleName('Canvas settings')
  const description = page.locator('[data-demo-case="screen-readers#avoid-hiding-interactive-content"]')
  await description.scrollIntoViewIfNeeded()
  await expect(description.frameLocator('iframe').getByRole('textbox', { name: 'Project name' })).toHaveAccessibleDescription('Use a descriptive project name.')
  await page.goto('/en/reference/width')
  const conditional = page.locator('[data-demo-case="width#apply-conditionally"]')
  await conditional.scrollIntoViewIfNeeded()
  const slider = conditional.getByLabel('Viewport', { exact: true })
  await slider.fill('900')
  await expect(conditional.locator('iframe')).toHaveCSS('width', '900px')
  await expect.poll(() => conditional.locator('iframe').evaluate((element: HTMLIFrameElement) => element.contentWindow!.innerWidth)).toBe(900)
  await conditional.getByRole('button', { name: 'Fit', exact: true }).click()
  expect(await conditional.locator('iframe').evaluate(element => element.getBoundingClientRect().width)).toBeLessThan(900)
})

test('flex growth and named grid areas have the documented geometry', async ({ page }) => {
  await page.goto('/en/reference/flex')
  const flex = page.locator('[data-demo-case="flex#let-an-item-fill-remaining-space"]')
  await flex.scrollIntoViewIfNeeded()
  const items = flex.frameLocator('iframe').locator('#layout > div')
  await expect(items).toHaveCount(2)
  const widths = await items.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width))
  expect(widths[1]).toBeGreaterThan(widths[0])
  await page.goto('/en/reference/grid-template-areas')
  const grid = page.locator('[data-demo-case]').first()
  await grid.scrollIntoViewIfNeeded()
  const areas = grid.frameLocator('iframe').locator('#layout > *')
  await expect(areas).toHaveCount(3)
  const bounds = await areas.evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect()
    return { top: rect.top, left: rect.left, width: rect.width }
  }))
  expect(bounds[0].width).toBeGreaterThan(bounds[1].width)
  expect(bounds[1].top).toBe(bounds[2].top)
  expect(bounds[2].left).toBeGreaterThan(bounds[1].left)
})

test('fixed and sticky positioning stay inside their real scroll environments', async ({ page }) => {
  await page.goto('/en/reference/position')
  const fixed = page.locator('[data-demo-case="position#positioning-elements-as-fixed"]')
  await fixed.scrollIntoViewIfNeeded()
  const input = fixed.frameLocator('iframe').getByRole('searchbox', { name: 'Filter assets' })
  await expect(input).toBeVisible()
  const initialTop = await input.evaluate(element => element.getBoundingClientRect().top)
  await fixed.locator('iframe').evaluate((element: HTMLIFrameElement) => element.contentWindow!.scrollTo(0, 180))
  expect(await input.evaluate(element => element.getBoundingClientRect().top)).toBe(initialTop)
  const sticky = page.locator('[data-demo-case="position#positioning-elements-as-sticky"]')
  await sticky.scrollIntoViewIfNeeded()
  const scroller = sticky.frameLocator('iframe').getByLabel('Scrollable asset list')
  await scroller.evaluate(element => { element.scrollTop = 160 })
  const geometry = await scroller.evaluate(element => ({
    parent: element.getBoundingClientRect().top,
    sticky: element.querySelector('[class~="sticky"]')!.getBoundingClientRect().top,
    offset: element.scrollTop,
  }))
  expect(geometry.offset).toBe(160)
  expect(geometry.sticky).toBeCloseTo(geometry.parent + 1, 0)
})

test('media comparisons preserve the authored aspect ratio and change only the tested property', async ({ page }) => {
  await page.goto('/en/reference/object-fit')
  for (const [section, firstFit, secondFit] of [
    ['cover-a-fixed-frame', 'cover', 'fill'],
    ['contain-the-full-media', 'contain', 'cover'],
    ['disable-object-fitting', 'none', 'scale-down'],
  ] as const) {
    const demo = page.locator(`[data-demo-case="object-fit#${section}"]`)
    await demo.scrollIntoViewIfNeeded()
    const images = demo.frameLocator('iframe').getByRole('img')
    await expect(images).toHaveCount(2)
    await expect(images.nth(0)).toHaveCSS('object-fit', firstFit)
    await expect(images.nth(1)).toHaveCSS('object-fit', secondFit)
    for (const image of await images.all()) {
      await expect(image).toHaveCSS('object-position', '100% 50%')
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth / element.naturalHeight)).toBe(1.6)
    }
    const dimensions = await images.evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })))
    expect(dimensions[0]).toEqual(dimensions[1])
    expect(dimensions[1].width / dimensions[1].height).toBeCloseTo(1, 2)
  }
})

test('native conditions respond to viewport, hover, theme and print', async ({ page, browserName }) => {
  await page.goto('/en/reference/height')
  const heightDemo = page.locator('[data-demo-case="height#apply-conditionally"]')
  await heightDemo.scrollIntoViewIfNeeded()
  await expect(heightDemo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  const heightTarget = heightDemo.frameLocator('iframe').locator('[data-target]')
  await heightDemo.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(heightTarget).toHaveCSS('height', '80px')
  await heightDemo.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(heightTarget).toHaveCSS('height', '48px')

  await page.goto('/en/reference/color')
  const demo = page.locator('[data-demo-case="color#apply-conditionally"]')
  await demo.scrollIntoViewIfNeeded()
  const iframe = demo.locator('iframe'), target = demo.frameLocator('iframe').locator('[data-target]')
  await expect(iframe).toHaveAttribute('data-ready', 'true')
  const theme = demo.getByRole('button', { name: 'Theme', exact: true })
  if (await iframe.evaluate((e: HTMLIFrameElement) => e.contentDocument!.documentElement.classList.contains('dark'))) await theme.click()
  await expect(target).toHaveAccessibleName('Preview details')
  await page.mouse.move(0, 0)
  const original = await target.evaluate(e => getComputedStyle(e).color)
  await theme.click(); await expect(target).not.toHaveCSS('color', original)
  await theme.click(); await expect(target).toHaveCSS('color', original)
  if (await page.evaluate(() => matchMedia('(hover:hover)').matches)) {
    await target.hover(); await expect(target).not.toHaveCSS('color', original)
    await page.mouse.move(0, 0); await expect(target).toHaveCSS('color', original)
  }
  await target.focus(); await page.keyboard.press('ArrowRight')
  await expect(target).toBeFocused(); await expect(target).not.toHaveCSS('color', original)
  if (browserName === 'chromium') {
    await page.emulateMedia({ media: 'print' })
    await expect(target).toHaveCSS('color', 'oklch(0 0 none)')
  }
})

test('animation playback, replay and keyboard controls respect reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en/reference/animation-direction')
  const demo = page.locator('[data-demo-case="animation-direction#play-alternately"]')
  await demo.scrollIntoViewIfNeeded()
  const frame = demo.locator('iframe')
  await expect.poll(() => frame.evaluate((element: HTMLIFrameElement) => element.contentDocument!.getAnimations().length)).toBeGreaterThan(0)
  await expect.poll(() => frame.evaluate((element: HTMLIFrameElement) => element.contentDocument!.getAnimations()[0]?.playState)).toBe('paused')
  const play = demo.getByRole('button', { name: 'Play', exact: true })
  await play.focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => frame.evaluate((element: HTMLIFrameElement) => Number(element.contentDocument!.getAnimations()[0]?.currentTime))).toBeGreaterThan(250)
  await demo.getByRole('button', { name: 'Pause', exact: true }).click()
  await expect.poll(() => frame.evaluate((element: HTMLIFrameElement) => element.contentDocument!.getAnimations()[0]?.playState)).toBe('paused')
  await demo.getByRole('button', { name: 'Replay', exact: true }).click()
  expect(await frame.evaluate((element: HTMLIFrameElement) => Number(element.contentDocument!.getAnimations()[0]?.currentTime))).toBeLessThan(250)
})

test('reduced motion suppresses authored transition durations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en/reference/transition-duration')
  const demo = page.locator('[data-demo-case]').first()
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  const targets = demo.frameLocator('iframe').locator('[data-target]')
  await expect(targets).toHaveCount(2)
  for (const target of await targets.all()) await expect(target).toHaveCSS('transition-duration', '0s')
})

test('scroll destination buttons and range controls work with the keyboard', async ({ page }) => {
  await page.goto('/en/reference/scroll-padding')
  const demo = page.locator('[data-demo-case]').first()
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  const frame = demo.frameLocator('iframe')
  await frame.getByRole('button', { name: 'Resources', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => frame.getByLabel('Scrollable collection').evaluate(element => element.scrollTop)).toBe(500)
  const conditional = page.locator('[data-demo-case="scroll-padding#apply-conditionally"]')
  await conditional.scrollIntoViewIfNeeded()
  const slider = conditional.getByLabel('Viewport', { exact: true })
  await slider.fill('500')
  await slider.focus()
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveValue('501')
  await expect(conditional.locator('iframe')).toHaveCSS('width', '501px')
})

test('representative compositions at 390, 768 and 1280px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith('mobile'), 'Desktop projects cover explicit viewport sizes in both themes.')
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['design-system', 'reference/clear', 'reference/align-items', 'reference/grid-template-areas', 'reference/position', 'reference/text-wrap', 'reference/animation-direction']) {
      await page.goto(`/en/${route}`)
      await expect(page.locator('.site-demo').first()).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
      await page.screenshot({ path: testInfo.outputPath(`${route.replace('/', '-')}-${width}.png`), fullPage: true, caret: 'initial' })
    }
  }
})

if (process.env.DEMO_SWEEP === '1') {
  const root = fileURLToPath(new URL('../../app/[locale]/reference/', import.meta.url))
  const pages = readdirSync(root).filter(slug => existsSync(path.join(root, slug, 'content.mdx')))
  for (const slug of pages) {
    test(`reference visual sweep: ${slug}`, async ({ page }, testInfo) => {
      const failures: string[] = []
      page.on('pageerror', error => failures.push(error.message))
      page.on('console', message => { if (message.type() === 'error') failures.push(message.text()) })
      page.on('response', response => {
        if (response.status() >= 400 && new URL(response.url()).origin === new URL(process.env.DEMO_BASE_URL || 'http://localhost:3000').origin) failures.push(`${response.status()} ${response.url()}`)
      })
      const response = await page.goto(`/en/reference/${slug}`)
      expect(response?.ok()).toBe(true)
      const demos = page.locator('[data-demo-case]')
      expect(await demos.count()).toBeGreaterThan(0)
      await expect(page.locator('.demo, .app-box, [class~="box"], [class~="bg:stripe"]')).toHaveCount(0)
      for (const demo of await demos.all()) {
        await demo.scrollIntoViewIfNeeded()
        await expect(demo.locator('iframe')).toBeVisible()
        await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
        await expect.poll(() => demo.locator('iframe').evaluate((element: HTMLIFrameElement) => Boolean(element.contentDocument?.body?.children.length))).toBe(true)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
      expect(failures).toEqual([])
      await page.screenshot({ path: testInfo.outputPath(`${slug}.png`), fullPage: true, caret: 'initial' })
    })
  }

  for (const route of ['brand', 'guide/colors', 'guide/elevation', 'guide/installation', 'guide/installation/nextjs', 'guide/introduction', 'guide/layout-system', 'guide/motion', 'guide/preload-critical-resources', 'guide/responsive-design', 'guide/sizing', 'guide/spacing', 'guide/syntax-tutorial', 'guide/typography', 'guide/view-transitions']) {
    test(`migrated demo page: ${route}`, async ({ page }, testInfo) => {
      const failures: string[] = []
      page.on('pageerror', error => failures.push(error.message))
      const response = await page.goto(`/en/${route}`)
      expect(response?.ok()).toBe(true)
      const demos = page.locator('.site-demo')
      expect(await demos.count()).toBeGreaterThan(0)
      await expect(page.locator('.demo')).toHaveCount(0)
      for (const demo of await demos.all()) {
        await demo.scrollIntoViewIfNeeded()
        await expect(demo).toBeVisible()
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
      expect(failures).toEqual([])
      await page.screenshot({ path: testInfo.outputPath(`${route.replace('/', '-')}.png`), fullPage: true, caret: 'initial' })
    })
  }
}
