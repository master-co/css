import { expect, test, type Locator } from '@playwright/test'
import { ready } from './interactions-helpers'

const recipe = (name: string) => `[data-foundation-type-motion="${name}"]`
const style = (item: Locator, property: string) => item.evaluate((e, property) => getComputedStyle(e).getPropertyValue(property), property)

test('font size and full treatment differ only in their documented type properties', async ({ page }) => {
  await page.goto('/en/guide/typography')
  const frame = await ready(page.locator(recipe('type-comparison')))
  const targets = frame.locator('[data-target]')
  await expect(targets).toHaveCount(2)
  for (const target of await targets.all()) {
    await expect(target).toHaveCSS('font-size', '32px')
    await expect(target).toHaveCSS('font-weight', '400')
  }
  expect(await targets.first().textContent()).toBe(await targets.last().textContent())
  expect(parseFloat(await style(targets.first(), 'line-height'))).toBeCloseTo(51.2, 2)
  expect(parseFloat(await style(targets.last(), 'line-height'))).toBeCloseTo(39.68, 2)
  expect(parseFloat((await style(targets.first(), 'letter-spacing')).replace('normal', '0'))).toBe(0)
  expect(parseFloat(await style(targets.last(), 'letter-spacing'))).toBeCloseTo(-0.768, 3)
  expect((await frame.locator('[data-style-readout]').allTextContents()).every(value => value !== '—')).toBe(true)
  await expect(page.locator('[id="without-vs-with--textsize"]')).toHaveCount(1)
  const weights = page.locator('table').filter({ hasText: 'Value / specimen' }).locator('tbody tr')
  await expect(weights).toHaveCount(9)
  expect(await weights.locator('span.text-md').evaluateAll(items => items.map(item => getComputedStyle(item).fontWeight))).toEqual(['100', '200', '300', '400', '500', '600', '700', '800', '900'])
})

test('finite native animations start paused, finish once and replay after completion', async ({ page, browserName }) => {
  await page.goto('/en/guide/motion')
  const demo = page.locator(recipe('finite-motion')), frame = await ready(demo)
  const snapshots = () => frame.locator('body').evaluate(e => {
    const win = e.ownerDocument.defaultView as Window & { specimens?: Animation[] }
    win.specimens ??= e.ownerDocument.getAnimations()
    return win.specimens.map(animation => ({ state: animation.playState, time: Number(animation.currentTime), ...animation.effect!.getTiming() }))
  })
  const initial = await snapshots()
  expect(initial.map(animation => animation.state)).toEqual(['paused', 'paused'])
  expect(initial.map(animation => animation.duration)).toEqual([300, 150])
  expect(initial.map(animation => animation.iterations)).toEqual([1, 1])
  await demo.getByRole('button', { name: 'Play', exact: true }).click()
  await expect.poll(async () => (await snapshots()).map(animation => animation.state)).toEqual(['finished', 'finished'])
  for (let repeat = 0; repeat < 2; repeat++) {
    await demo.getByRole('button', { name: 'Replay', exact: true }).click()
    expect((await snapshots())[0].time).toBeLessThan(300)
    await expect.poll(async () => (await snapshots()).map(animation => animation.state)).toEqual(['finished', 'finished'])
  }
  await expect(frame.locator('#fade')).toHaveCSS('opacity', '1')
  await expect(frame.locator('#zoom')).toHaveCSS('transform', 'none')
  if (browserName === 'chromium') {
    await page.emulateMedia({ media: 'print' })
    for (const id of ['fade', 'zoom']) await expect(frame.locator(`#${id}`)).toHaveCSS('animation-name', 'none')
  }
})

test('transition has a native delay and interpolation with a stable keyboard trigger', async ({ page, browserName }) => {
  await page.goto('/en/guide/motion')
  const frame = await ready(page.locator(recipe('state-transition')))
  const checkbox = frame.getByRole('checkbox', { name: 'Move layer' }), layer = frame.locator('#layer')
  await expect(layer).toHaveCSS('transition-duration', '0.3s')
  await expect(layer).toHaveCSS('transition-delay', '0.15s')
  await checkbox.focus(); await page.keyboard.press('Space')
  await expect(checkbox).toBeChecked(); await expect(checkbox).toBeFocused()
  await expect(checkbox).toHaveCSS('outline-width', '2px')
  const native = await layer.evaluate(e => e.getAnimations().map(animation => ({ transition: 'transitionProperty' in animation, ...animation.effect!.getTiming() })))
  expect(native).toContainEqual(expect.objectContaining({ transition: true, duration: 300, delay: 150 }))
  await expect(layer).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 96, 0)')
  await page.keyboard.press('Space'); await expect(layer).toHaveCSS('transform', 'none')
  if (browserName === 'chromium') {
    await checkbox.check(); await page.emulateMedia({ media: 'print' })
    await expect(layer).toHaveCSS('transform', 'none')
    await expect(layer).toHaveCSS('transition-duration', '0s')
  }
})

test('dialog has a native modal boundary, accessible text and working close and reopen', async ({ page }, info) => {
  await page.goto('/en/guide/motion')
  const frame = await ready(page.locator(recipe('dialog-entrance')))
  const open = frame.getByRole('button', { name: 'Open details' }), dialog = frame.getByRole('dialog', { name: 'Collection details' })
  await open.focus(); await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAccessibleDescription('This dialog has a finite entrance. Closing it is immediate.')
  expect(await dialog.evaluate(e => e.matches(':modal'))).toBe(true)
  await expect(dialog).toHaveCSS('animation-duration', '0.18s')
  await expect(dialog).toHaveCSS('animation-iteration-count', '1')
  await expect(dialog).toHaveCSS('opacity', '1')
  await page.locator(recipe('dialog-entrance')).screenshot({ path: info.outputPath('dialog-open.png'), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  await expect(frame.getByRole('button', { name: 'Close details' })).toBeFocused()
  await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(open).toBeFocused()
  await open.click(); await expect(dialog).toBeVisible()
  await frame.getByRole('button', { name: 'Close details' }).click()
  await expect(dialog).toBeHidden(); await expect(open).toBeFocused()
})

test('reduced motion removes animation, transition duration and delay while preserving real states', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en/guide/motion')
  const entrance = await ready(page.locator(recipe('finite-motion')))
  for (const name of ['fade', 'zoom']) await expect(entrance.locator(`#${name}`)).toHaveCSS('animation-name', 'none')
  await expect(entrance.locator('#fade')).toHaveCSS('opacity', '1')
  await expect(entrance.locator('#zoom')).toHaveCSS('transform', 'none')
  const transition = await ready(page.locator(recipe('state-transition'))), layer = transition.locator('#layer')
  await expect(layer).toHaveCSS('transition-duration', '0s'); await expect(layer).toHaveCSS('transition-delay', '0s')
  await transition.getByRole('checkbox', { name: 'Move layer' }).check()
  await expect(layer).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 96, 0)')
  const modal = await ready(page.locator(recipe('dialog-entrance')))
  await modal.getByRole('button', { name: 'Open details' }).click()
  const dialog = modal.getByRole('dialog', { name: 'Collection details' })
  await expect(dialog).toHaveCSS('animation-name', 'none'); await expect(dialog).toHaveCSS('opacity', '1')
  await modal.getByRole('button', { name: 'Close details' }).click()
})

for (const route of ['typography', 'motion']) test(`type and motion composition: ${route}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.setViewportSize({ ...page.viewportSize()!, height: 1600 })
  await page.goto(`/en/guide/${route}`)
  await page.addStyleTag({ content: 'nextjs-portal{visibility:hidden}' })
  for (const [i, demo] of (await page.locator('.site-demo').all()).entries()) {
    if (await demo.locator('iframe').count() === 1) await ready(demo)
    expect(await demo.evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
    await demo.screenshot({ path: info.outputPath(`demo-${i}.png`), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  expect(errors).toEqual([])
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: info.outputPath('page.png'), fullPage: true, scale: 'css' })
})

test('type and motion gallery includes all five reusable recipes', async ({ page }, info) => {
  await page.setViewportSize({ ...page.viewportSize()!, height: 1600 })
  await page.goto('/en/design-system')
  await page.addStyleTag({ content: 'nextjs-portal{visibility:hidden}' })
  await expect(page.locator('[data-type-motion-recipe]')).toHaveCount(5)
  for (const [i, demo] of (await page.locator('[data-foundation-type-motion]').all()).entries()) {
    await ready(demo)
    await demo.screenshot({ path: info.outputPath(`recipe-${i}.png`), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  }
})

test('foundation search finds exported table text and preserves stable anchors and keyboard focus', async ({ page }, info) => {
  await page.goto('/en/guide/typography')
  const specimen = page.locator(recipe('type-comparison'))
  await ready(specimen)
  const origin = page.getByRole('link', { name: 'font family', exact: true })
  await origin.scrollIntoViewIfNeeded()
  await origin.focus(); await page.keyboard.press('ControlOrMeta+k')
  const dialog = page.getByRole('dialog', { name: 'Search documentation' })
  const input = dialog.getByRole('searchbox', { name: 'Search documentation' })
  await input.fill('Compare font size and text scale')
  await expect(dialog.locator('a[href$="/guide/typography#without-vs-with--textsize"]')).toHaveCount(1)
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(origin).toBeFocused()
  await page.keyboard.press('ControlOrMeta+k')
  await expect(input).toHaveValue('Compare font size and text scale')
  await input.fill('Opacity rises from 0 to 1')
  const result = dialog.locator('a[href$="/guide/motion#animation-recipes"]')
  await expect(result).toHaveCount(1)
  expect(await dialog.evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
  await dialog.screenshot({ path: info.outputPath('foundation-search.png'), scale: 'css' })
  const index = Number((await result.getAttribute('id'))!.replace('documentation-result-', ''))
  for (let i = 0; i < index; i++) await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/guide\/motion#animation-recipes$/)
  await expect(page.locator('#animation-recipes')).toBeInViewport()
})
