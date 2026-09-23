import { expect, test, type Locator, type Page } from '@playwright/test'
import { nativeDrag, resizeHandle, scene, selected, target } from './interactions-helpers'

test('native pointer: WebKit resize handles change only the permitted axes', async ({ page }) => {
  await page.goto('/en/reference/resize')
  const both = await scene(page, 'resize', 'allow-both-axis-resizing')
  const b = await resizeHandle(page, target(both))
  expect(b.after.width).toBeGreaterThan(b.before.width); expect(b.after.height).toBeGreaterThan(b.before.height)
  await expect(both.locator('[data-size-readout]')).toContainText(`${b.after.width} × ${b.after.height} px`)
  const axes = await scene(page, 'resize', 'restrict-resizing-to-one-axis')
  const v = await resizeHandle(page, target(axes, 0)); expect(v.after.width).toBe(v.before.width); expect(v.after.height).toBeGreaterThan(v.before.height)
  const h = await resizeHandle(page, target(axes, 1)); expect(h.after.height).toBe(h.before.height); expect(h.after.width).toBeGreaterThan(h.before.width)
  const none = await scene(page, 'resize', 'disable-native-resizing')
  const fixed = await resizeHandle(page, target(none)); expect(fixed.after.width).toBe(fixed.before.width); expect(fixed.after.height).toBe(fixed.before.height)
})

test('native pointer: WebKit observes genuine image and element drag starts', async ({ page }) => {
  await page.goto('/en/reference/user-drag')
  const media = await scene(page, 'user-drag', 'prevent-dragging-media')
  for (const i of [0, 1, 2]) await nativeDrag(page, target(media, i))
  await expect(media.locator('[data-drag-readout="example-0-target"]')).toHaveText('No start observed')
  await expect(media.locator('[data-drag-readout="example-1-target"]')).toContainText('1 start')
  await expect(media.locator('[data-drag-readout="example-2-target"]')).toHaveText('No start observed')
  const explicit = await scene(page, 'user-drag', 'keep-draggable-elements-explicit')
  for (const i of [0, 1]) {
    await nativeDrag(page, target(explicit, i))
    await expect(explicit.locator(`[data-drag-readout="example-${i}-target"]`)).toContainText('1 start')
  }
  const lock = await scene(page, 'user-drag', 'apply-conditionally')
  await lock.getByRole('checkbox').check(); await nativeDrag(page, target(lock))
  await expect(lock.locator('[data-drag-readout]')).toHaveText('No start observed')
  await lock.getByRole('checkbox').uncheck(); await nativeDrag(page, target(lock))
  await expect(lock.locator('[data-drag-readout]')).toContainText('1 start')
})

test('native pointer: WebKit selection respects atomic and partial text boundaries', async ({ page }) => {
  await page.goto('/en/reference/user-select')
  const all = await scene(page, 'user-select', 'select-all-text-in-one-click')
  await target(all).dblclick(); expect(await selected(target(all))).toBe('pnpm install @master/css')
  const text = await scene(page, 'user-select', 'preserve-normal-reading-selection')
  await target(text).dblclick(); const selection = await selected(target(text))
  expect(selection.length).toBeGreaterThan(0); expect(selection.length).toBeLessThan((await target(text).textContent())!.length)
  const conditional = await scene(page, 'user-select', 'apply-conditionally')
  await conditional.getByRole('checkbox').check()
  // Clicking the named control establishes a fresh selection context before the gesture.
  await target(conditional).dblclick(); expect(await selected(target(conditional))).toBe('')
  await conditional.getByRole('checkbox').uncheck(); await target(conditional).dblclick()
  expect((await selected(target(conditional))).length).toBeGreaterThan(0)
})

async function swipe(page: Page, element: Locator, axis: 'x' | 'y') {
  await element.scrollIntoViewIfNeeded()
  const box = (await element.boundingBox())!
  const x = box.x + box.width * (axis === 'x' ? .8 : .5), y = box.y + box.height * (axis === 'y' ? .8 : .5)
  const session = await page.context().newCDPSession(page)
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let step = 1; step <= 10; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - (axis === 'x' ? step * 10 : 0), y: y - (axis === 'y' ? step * 10 : 0) }] })
      await page.waitForTimeout(16)
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally { await session.detach() }
}

test('native touch: browser gestures distinguish none, auto and pan-y while taps remain native', async ({ page }) => {
  await page.goto('/en/reference/touch-action')
  const base = await scene(page, 'touch-action', 'disable-browser-gestures-on-a-custom-surface')
  await swipe(page, target(base, 0), 'y')
  expect(await target(base, 0).evaluate(e => e.scrollTop)).toBe(0)
  await swipe(page, target(base, 1), 'y')
  await expect.poll(() => target(base, 1).evaluate(e => e.scrollTop)).toBeGreaterThan(25)
  const vertical = await scene(page, 'touch-action', 'allow-vertical-scrolling')
  await swipe(page, target(vertical), 'x'); expect(await target(vertical).evaluate(e => e.scrollLeft)).toBe(0)
  await swipe(page, target(vertical), 'y'); await expect.poll(() => target(vertical).evaluate(e => e.scrollTop)).toBeGreaterThan(25)
  const tap = await scene(page, 'touch-action', 'optimize-tap-controls')
  await tap.getByRole('checkbox', { name: 'Show grid' }).tap(); await expect(tap.getByRole('checkbox')).toBeChecked()
})
