import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['transition', 'transition-property', 'transition-duration', 'transition-delay', 'transition-timing-function']
const example = (page: Page, route: string, section: string) => page.locator(`[data-demo-case="${route}#${section}"]`)
const target = (frame: FrameLocator, index?: number) => frame.locator(`#${index === undefined ? '' : `example-${index}-`}target`)
async function ready(demo: Locator) {
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  for (const legend of await demo.locator('legend.sr-only').all()) await expect(legend).toHaveCSS('position', 'absolute')
  await demo.locator('iframe').evaluate(async (element: HTMLIFrameElement) => { await element.contentDocument!.fonts.ready })
  return demo.frameLocator('iframe')
}
async function scene(page: Page, route: string, section: string) { return ready(example(page, route, section)) }
async function keyboard(page: Page, item: Locator) {
  await item.focus(); await page.keyboard.press('ArrowRight'); await expect(item).toBeFocused()
  expect(await item.evaluate(e => e.matches(':focus-visible'))).toBe(true)
}
async function viewport(demo: Locator, width: number) {
  await demo.getByLabel('Viewport', { exact: true }).fill(String(width))
  await expect.poll(() => demo.locator('iframe').evaluate(e => e.clientWidth)).toBe(width)
}
async function print(page: Page, browserName: string, item: Locator, property: string, value: string) {
  if (browserName === 'chromium') {
    await page.emulateMedia({ media: 'print' }); await expect(item).toHaveCSS(property, value)
    await page.emulateMedia({ media: 'screen' })
  }
}
async function condition(page: Page, route: string) {
  const demo = example(page, route, 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 390)
  return { demo, item: target(frame), frame }
}
// Native checkbox activation creates the CSS transitions. Pausing their actual
// timelines makes interpolation assertions independent of test-runner latency.
async function toggle(item: Locator) {
  return item.evaluate(e => {
    const label = e.closest('label')!
    void getComputedStyle(e).transform
    label.querySelector('input')!.click()
    return Array.from(label.querySelectorAll('span')).flatMap(child => child.getAnimations()).map(animation => {
      animation.pause()
      const timing = animation.effect!.getTiming()
      return { property: (animation as CSSTransition).transitionProperty, duration: timing.duration, delay: timing.delay, easing: timing.easing }
    })
  })
}
async function at(item: Locator, time: number) {
  return item.evaluate(async (e, time) => {
    e.getAnimations().forEach(animation => { animation.currentTime = time })
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    const style = getComputedStyle(e)
    return { x: new DOMMatrixReadOnly(style.transform).e, opacity: Number(style.opacity) }
  }, time)
}
async function finish(item: Locator) {
  await item.evaluate(async e => {
    const animations = e.getAnimations()
    animations.forEach(animation => { animation.finish() })
    await Promise.all(animations.map(animation => animation.finished))
  })
}

test('transition shorthand preserves native control states, a real link and media-specific duration', async ({ page, browserName }) => {
  await page.goto('/en/reference/transition')
  const base = await scene(page, 'transition', 'declare-a-complete-transition'), button = target(base)
  await expect(button).toHaveAccessibleName('Preview changes'); await expect(button).toHaveCSS('opacity', '0.72')
  await keyboard(page, button); await expect(button).toHaveCSS('opacity', '1')
  await expect(button).toHaveCSS('transition-duration', '0.15s')
  await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(button).toHaveCSS('transition-duration', '0s')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const linkFrame = await scene(page, 'transition', 'animate-transforms-explicitly'), link = target(linkFrame)
  await expect(link).toHaveAccessibleName('View report'); await keyboard(page, link)
  await expect(link).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -8)')
  await page.keyboard.press('Enter'); await expect(linkFrame.locator('#report')).toBeFocused()
  const longhands = target(await scene(page, 'transition', 'split-longhands-when-states-differ'))
  await expect(longhands).toHaveCSS('transition-property', 'opacity'); await expect(longhands).toHaveCSS('transition-timing-function', 'ease-out')
  await print(page, browserName, longhands, 'transition-duration', '0s')
  const { demo, item, frame } = await condition(page, 'transition')
  await expect(item).toHaveCSS('transition-duration', '0s')
  const checkbox = frame.getByRole('checkbox', { name: 'Fade layer' })
  await keyboard(page, checkbox); await page.keyboard.press('Space'); await expect(checkbox).toBeChecked()
  await expect(item).toHaveCSS('opacity', '0.72')
  await viewport(demo, 900); await expect(item).toHaveCSS('transition-duration', '0.15s')
  await print(page, browserName, item, 'transition-duration', '0s')
})

test('property lists animate only selected changes and none prevents transition creation', async ({ page, browserName }) => {
  await page.goto('/en/reference/transition-property')
  const base = await scene(page, 'transition-property', 'limit-what-can-animate')
  expect((await toggle(target(base, 0))).map(x => x.property)).toEqual(['opacity'])
  expect(await at(target(base, 0), 400)).toEqual({ x: 96, opacity: 0.86 })
  expect((await toggle(target(base, 1))).map(x => x.property).sort()).toEqual(['opacity', 'transform'])
  const middle = await at(target(base, 1), 400); expect(middle.x).toBeCloseTo(48, 2); expect(middle.opacity).toBeCloseTo(0.86, 2)
  const lift = target(await scene(page, 'transition-property', 'pair-with-duration-and-easing'))
  await keyboard(page, lift); await expect(lift).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -8)')
  await expect(lift).toHaveCSS('transition-duration', '0.2s')
  const disabled = await scene(page, 'transition-property', 'disable-accidental-transitions')
  expect(await toggle(target(disabled, 0))).toHaveLength(1)
  expect(await toggle(target(disabled, 1))).toEqual([]); expect((await at(target(disabled, 1), 400)).x).toBe(96)
  const { demo, item } = await condition(page, 'transition-property')
  await expect(item).toHaveCSS('transition-property', 'opacity'); await viewport(demo, 900)
  await expect(item).toHaveCSS('transition-property', 'opacity, transform')
  await print(page, browserName, item, 'transition-property', 'none')
})

test('duration changes actual interpolation time while zero duration preserves the endpoint immediately', async ({ page, browserName }) => {
  await page.goto('/en/reference/transition-duration')
  const base = await scene(page, 'transition-duration', 'set-transition-speed')
  for (const [index, duration] of [150, 500].entries()) {
    expect((await toggle(target(base, index)))[0].duration).toBe(duration)
    expect((await at(target(base, index), duration / 2)).x).toBeCloseTo(48, 2)
  }
  const distance = await scene(page, 'transition-duration', 'match-duration-to-distance')
  for (const index of [0, 1]) { await toggle(target(distance, index)); expect((await at(target(distance, index), 150)).x).toBeCloseTo(24, 2) }
  const immediate = await scene(page, 'transition-duration', 'remove-motion-for-static-contexts')
  expect(await toggle(target(immediate, 0))).toHaveLength(1)
  expect(await toggle(target(immediate, 1))).toEqual([]); expect((await at(target(immediate, 1), 0)).x).toBe(96)
  const { demo, item } = await condition(page, 'transition-duration')
  await expect(item).toHaveCSS('transition-duration', '0.15s'); await viewport(demo, 900)
  await expect(item).toHaveCSS('transition-duration', '0.5s')
  await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(item).toHaveCSS('transition-duration', '0s')
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await print(page, browserName, item, 'transition-duration', '0s')
})

test('delays hold native endpoints, stagger children and reset through checked and viewport conditions', async ({ page, browserName }) => {
  await page.goto('/en/reference/transition-delay')
  const base = await scene(page, 'transition-delay', 'delay-a-transition')
  for (const index of [0, 1]) await toggle(target(base, index))
  expect((await at(target(base, 0), 150)).x).toBeCloseTo(18, 2)
  expect((await at(target(base, 1), 150)).x).toBe(0)
  expect((await at(target(base, 1), 700)).x).toBeCloseTo(48, 2)
  const stagger = await scene(page, 'transition-delay', 'stagger-sibling-elements'), second = target(stagger)
  const timings = await toggle(second)
  expect(timings.map(x => x.delay).sort()).toEqual([0, 300])
  expect((await at(stagger.locator('#first'), 150)).x).toBeCloseTo(18, 2)
  expect((await at(second, 150)).x).toBe(0)
  const token = target(await scene(page, 'transition-delay', 'use-duration-tokens'))
  await expect(token).toHaveCSS('transition-delay', '0.08s'); expect((await toggle(token))[0].delay).toBe(80)
  const resetDemo = example(page, 'transition-delay', 'reset-delay-at-breakpoints'), resetFrame = await ready(resetDemo)
  await viewport(resetDemo, 390); await expect(target(resetFrame)).toHaveCSS('transition-delay', '0.3s')
  await viewport(resetDemo, 900); await expect(target(resetFrame)).toHaveCSS('transition-delay', '0s')
  const conditional = target(await scene(page, 'transition-delay', 'apply-conditionally'))
  expect((await toggle(conditional))[0].delay).toBe(300); await finish(conditional)
  expect((await toggle(conditional))[0].delay).toBe(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(token).toHaveCSS('transition-delay', '0s'); await expect(token).toHaveCSS('transition-duration', '0s')
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await print(page, browserName, conditional, 'transition-delay', '0s')
})

test('easing curves alter actual progress while stepped and state-specific timing retain explicit endpoints', async ({ page, browserName }) => {
  await page.goto('/en/reference/transition-timing-function')
  const curves = await scene(page, 'transition-timing-function', 'choose-an-easing-curve'), progress: number[] = []
  for (const index of [0, 1, 2]) { await toggle(target(curves, index)); progress.push((await at(target(curves, index), 400)).x) }
  expect(progress[0]).toBeCloseTo(48, 2); expect(progress[1]).toBeLessThan(35); expect(progress[2]).toBeGreaterThan(61)
  const stepped = await scene(page, 'transition-timing-function', 'use-linear-timing-for-continuous-motion')
  await toggle(target(stepped, 0)); expect((await at(target(stepped, 0), 125)).x).toBeCloseTo(12, 2)
  await toggle(target(stepped, 1))
  for (const [time, x] of [[125, 0], [250, 24], [500, 48], [999, 72], [1000, 96]]) expect((await at(target(stepped, 1), time)).x).toBeCloseTo(x, 2)
  const directions = target(await scene(page, 'transition-timing-function', 'keep-entrance-and-exit-curves-intentional'))
  expect((await toggle(directions))[0].easing).toBe('ease-out'); await finish(directions)
  expect((await toggle(directions))[0].easing).toBe('ease-in')
  const { demo, item } = await condition(page, 'transition-timing-function')
  await expect(item).toHaveCSS('transition-timing-function', 'ease-out'); await viewport(demo, 900)
  await expect(item).toHaveCSS('transition-timing-function', 'linear')
  await print(page, browserName, item, 'transition-duration', '0s')
})

for (const route of routes) {
  test(`transitions composition: ${route}`, async ({ page }, testInfo) => {
    const failures: string[] = []
    page.on('pageerror', error => failures.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && /hydration|hydrate|mismatch/i.test(message.text())) failures.push(message.text()) })
    await page.goto(`/en/reference/${route}`)
    await page.addStyleTag({ content: 'nextjs-portal { visibility: hidden }' })
    for (const [index, demo] of (await page.locator('[data-demo-case]').all()).entries()) {
      const frame = await ready(demo)
      const dark = await page.locator('html').evaluate(e => e.classList.contains('dark'))
      await expect(frame.locator('html')).toHaveAttribute('class', dark ? 'dark' : 'light')
      expect(await frame.locator('body').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
      for (const item of await frame.locator('[data-target]').all()) await expect(item).toHaveAttribute('data-appearance', 'plain')
      await demo.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 96))
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      await demo.screenshot({ path: testInfo.outputPath(`demo-${index}.png`), scale: 'css' })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    expect(failures).toEqual([])
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true, scale: 'css' })
  })
}
