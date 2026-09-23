import { expect, test } from '@playwright/test'
import { clickAt, example, nativeDrag, ready, resizeHandle, routes, scene, selected, target, viewport } from './interactions-helpers'

test('accent preserves native groups, inherited paint and keyboard input', async ({ page, browserName }) => {
  await page.goto('/en/reference/accent-color')
  const frame = await scene(page, 'accent-color', 'set-the-accent-color')
  await expect(target(frame, 0)).toHaveCSS('accent-color', 'auto')
  const color = await target(frame, 1).evaluate(e => getComputedStyle(e).accentColor)
  expect(color).not.toBe('auto')
  await expect(target(frame, 1).getByRole('checkbox')).toHaveCSS('accent-color', color)
  const first = target(frame, 0).getByRole('checkbox')
  await first.focus(); await page.keyboard.press('Space'); await expect(first).not.toBeChecked()
  await target(frame, 1).getByRole('radio', { name: 'Layers', exact: true }).check()
  await expect(target(frame, 1).getByRole('radio', { name: 'Canvas', exact: true })).not.toBeChecked()
  await expect(target(frame, 0).getByRole('radio', { name: 'Canvas', exact: true })).toBeChecked()
  const slider = target(frame, 1).getByRole('slider', { name: 'Zoom' })
  await slider.focus(); await page.keyboard.press('ArrowRight'); await expect(slider).toHaveValue('66')
  const demo = example(page, 'accent-color', 'apply-conditionally'), conditional = await ready(demo)
  await viewport(demo, 390); const initial = await target(conditional).evaluate(e => getComputedStyle(e).accentColor)
  await viewport(demo, 900); await expect(target(conditional)).not.toHaveCSS('accent-color', initial)
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(conditional)).toHaveCSS('accent-color', 'auto') }
})

test('appearance retains options, a real label and native focus states', async ({ page, browserName }) => {
  await page.goto('/en/reference/appearance')
  const base = await scene(page, 'appearance', 'remove-default-styling')
  await expect(target(base, 0)).toHaveCSS('appearance', 'none')
  await expect(target(base, 1)).toHaveCSS('appearance', 'auto')
  for (const item of [target(base, 0), target(base, 1)]) {
    await expect(item).toHaveAccessibleName('Sort assets'); await expect(item.locator('option')).toHaveCount(3)
    // Native type-ahead avoids platform-specific popup-opening keys.
    await item.focus(); await page.keyboard.press('o'); await page.keyboard.press('Enter')
    await expect(item).toHaveValue('oldest')
  }
  const demo = example(page, 'appearance', 'restore-native-appearance'), frame = await ready(demo)
  await viewport(demo, 390); await expect(target(frame)).toHaveCSS('appearance', 'none')
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('appearance', 'auto')
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('appearance', 'auto'); await page.emulateMedia({ media: 'screen' }) }
  const semantics = await scene(page, 'appearance', 'keep-semantics-intact')
  await expect(target(semantics)).toHaveAccessibleName('Sort assets')
  const focus = await scene(page, 'appearance', 'apply-conditionally')
  await target(focus).focus(); await expect(target(focus)).toHaveCSS('appearance', 'none')
  await focus.getByRole('checkbox').focus(); await expect(target(focus)).toHaveCSS('appearance', 'auto')
})

test('caret comparisons keep each description connected and inputs editable', async ({ page }) => {
  await page.goto('/en/reference/caret-color')
  const base = await scene(page, 'caret-color', 'set-the-text-caret-color')
  for (const i of [0, 1]) {
    await expect(target(base, i)).toHaveAccessibleName('Layer name')
    await expect(target(base, i)).toHaveAccessibleDescription('Type a name, then move the insertion caret with the arrow keys.')
    await target(base, i).fill(`Layer ${i}`); await expect(target(base, i)).toHaveValue(`Layer ${i}`)
    await expect(target(base, i)).toHaveAttribute('aria-describedby', `example-${i}-caret-help`)
  }
  const current = await scene(page, 'caret-color', 'use-the-current-text-color')
  const color = await target(current).evaluate(e => getComputedStyle(e).color)
  await expect(target(current)).toHaveCSS('caret-color', color)
  const hidden = await scene(page, 'caret-color', 'hide-the-caret-intentionally')
  await expect(target(hidden)).toHaveCSS('caret-color', 'rgba(0, 0, 0, 0)')
  await target(hidden).fill('Still editable'); await expect(target(hidden)).toHaveValue('Still editable')
  const focus = await scene(page, 'caret-color', 'apply-conditionally')
  await focus.getByRole('checkbox').focus(); const caret = await target(focus).evaluate(e => getComputedStyle(e).caretColor)
  await target(focus).focus(); await expect(target(focus)).not.toHaveCSS('caret-color', caret)
  await expect(target(focus)).toHaveCSS('outline-style', 'solid')
})

test('cursor subjects have actual disclosure, disabled and drag semantics', async ({ page, browserName }) => {
  await page.goto('/en/reference/cursor')
  const base = await scene(page, 'cursor', 'show-clickable-affordance')
  await expect(target(base)).toHaveCSS('cursor', 'pointer')
  await target(base).focus(); await page.keyboard.press('Enter'); await expect(base.getByRole('checkbox', { name: 'Show grid', exact: true })).toBeVisible()
  const disabled = await scene(page, 'cursor', 'mark-disabled-actions')
  await expect(target(disabled)).toBeDisabled(); await expect(target(disabled)).toHaveCSS('cursor', 'not-allowed')
  const name = disabled.getByRole('textbox', { name: 'Project name' })
  await name.fill('Edited'); await clickAt(page, target(disabled)); await expect(name).toHaveValue('Edited')
  await disabled.getByRole('button', { name: 'Reset name', exact: true }).click(); await expect(name).toHaveValue('Canvas')
  const drag = await scene(page, 'cursor', 'support-drag-handles')
  await expect(target(drag)).toHaveAttribute('draggable', 'true'); await expect(target(drag)).toHaveCSS('cursor', 'grab')
  const demo = example(page, 'cursor', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 390); await expect(target(frame)).toHaveCSS('cursor', 'default')
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('cursor', 'pointer')
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('cursor', 'auto') }
})

test('pointer overlays preserve hit testing, native activation and keyboard access', async ({ page, isMobile }) => {
  await page.goto('/en/reference/pointer-events')
  const base = await scene(page, 'pointer-events', 'let-clicks-pass-through-an-overlay')
  const checks = base.getByRole('checkbox')
  await clickAt(page, checks.nth(0), isMobile); await expect(checks.nth(0)).toBeChecked()
  await clickAt(page, checks.nth(1), isMobile); await expect(checks.nth(1)).not.toBeChecked()
  await checks.nth(1).focus(); await page.keyboard.press('Space'); await expect(checks.nth(1)).toBeChecked()
  const icon = await scene(page, 'pointer-events', 'use-the-untouchable-alias')
  await icon.getByRole('textbox').fill('Edited'); await clickAt(page, target(icon), isMobile)
  await expect(icon.getByRole('textbox')).toHaveValue('Canvas')
  expect(await target(icon).evaluate(e => { const r = e.getBoundingClientRect(); return e.ownerDocument.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.tagName })).toBe('BUTTON')
  const restored = await scene(page, 'pointer-events', 'restore-pointer-events-on-a-child')
  await expect(target(restored)).toHaveCSS('pointer-events', 'auto'); await restored.getByRole('checkbox').check()
  const demo = example(page, 'pointer-events', 'apply-conditionally'), frame = await ready(demo), checkbox = frame.getByRole('checkbox')
  await viewport(demo, 390); await clickAt(page, checkbox, isMobile); await expect(checkbox).not.toBeChecked()
  await checkbox.focus(); await page.keyboard.press('Space'); await expect(checkbox).toBeChecked()
  await viewport(demo, 900); await clickAt(page, checkbox, isMobile); await expect(checkbox).not.toBeChecked()
})

test('resize observes constrained native dimensions without disabling editing', async ({ page, browserName }) => {
  await page.goto('/en/reference/resize')
  const base = await scene(page, 'resize', 'allow-both-axis-resizing')
  await expect(target(base)).toHaveAccessibleName('Notes'); await expect(target(base)).toHaveCSS('resize', 'both')
  if (browserName === 'chromium') {
    const box = await resizeHandle(page, target(base)); expect(box.after.width).toBeGreaterThan(box.before.width); expect(box.after.height).toBeGreaterThan(box.before.height)
    await expect(base.locator('[data-size-readout]')).toContainText(`${box.after.width} × ${box.after.height} px`)
  }
  const axes = await scene(page, 'resize', 'restrict-resizing-to-one-axis')
  await expect(target(axes, 0)).toHaveCSS('resize', 'vertical'); await expect(target(axes, 1)).toHaveCSS('resize', 'horizontal')
  if (browserName === 'chromium') {
    const v = await resizeHandle(page, target(axes, 0)); expect(v.after.width).toBe(v.before.width); expect(v.after.height).toBeGreaterThan(v.before.height)
    const h = await resizeHandle(page, target(axes, 1)); expect(h.after.height).toBe(h.before.height); expect(h.after.width).toBeGreaterThan(h.before.width)
  }
  const none = await scene(page, 'resize', 'disable-native-resizing')
  await expect(target(none)).toHaveCSS('resize', 'none'); await target(none).fill('Editable notes'); await expect(target(none)).toHaveValue('Editable notes')
  const demo = example(page, 'resize', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 390); await expect(target(frame)).toHaveCSS('resize', 'none')
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('resize', 'vertical')
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('resize', 'none') }
})

test('screen reader examples retain real accessible names, descriptions and actions', async ({ page, browserName }) => {
  await page.goto('/en/reference/screen-readers')
  const base = await scene(page, 'screen-readers', 'hide-text-visually')
  const summary = base.locator('summary')
  await expect(summary).toHaveAccessibleName('Canvas settings'); await expect(target(base)).toHaveCSS('width', '1px')
  await summary.focus(); await page.keyboard.press('Enter'); await expect(base.getByRole('checkbox', { name: 'Show grid', exact: true })).toBeVisible()
  const icon = await scene(page, 'screen-readers', 'label-icon-only-controls')
  await icon.getByRole('textbox').fill('Edited')
  await icon.getByRole('button', { name: 'Reset project name', exact: true }).focus(); await page.keyboard.press('Space')
  await expect(icon.getByRole('textbox')).toHaveValue('Canvas')
  const description = await scene(page, 'screen-readers', 'avoid-hiding-interactive-content')
  await expect(target(description)).toHaveAccessibleName('Project name')
  await expect(target(description)).toHaveAccessibleDescription('Use a descriptive project name.')
  await expect(target(description)).toBeVisible(); await target(description).fill('New name')
  const demo = example(page, 'screen-readers', 'apply-conditionally'), frame = await ready(demo)
  const button = frame.getByRole('button', { name: 'Reset project name', exact: true })
  await viewport(demo, 390); await expect(target(frame)).toHaveCSS('position', 'static'); await expect(button).toBeVisible()
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('position', 'absolute'); await expect(target(frame)).toHaveCSS('width', '1px'); await expect(button).toBeVisible()
  await frame.getByRole('textbox').fill('Wide name'); await button.click(); await expect(frame.getByRole('textbox')).toHaveValue('Canvas')
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('position', 'static') }
})

test('touch policy keeps named scroll regions, real tap controls and viewport rules', async ({ page, isMobile }) => {
  await page.goto('/en/reference/touch-action')
  const base = await scene(page, 'touch-action', 'disable-browser-gestures-on-a-custom-surface')
  await expect(target(base, 0)).toHaveCSS('touch-action', 'none'); await expect(target(base, 1)).toHaveCSS('touch-action', 'auto')
  for (const i of [0, 1]) {
    await expect(target(base, i)).toHaveAccessibleName('Gesture test')
    await target(base, i).focus(); await expect(target(base, i)).toBeFocused()
    // iOS does not expose this desktop keyboard-scrolling path; touch gestures have a separate native-input test.
    if (!isMobile) { await page.keyboard.press('ArrowDown'); await expect.poll(() => target(base, i).evaluate(e => e.scrollTop)).toBeGreaterThan(0) }
  }
  const vertical = await scene(page, 'touch-action', 'allow-vertical-scrolling')
  await expect(target(vertical)).toHaveCSS('touch-action', 'pan-y')
  await target(vertical).focus(); await expect(target(vertical)).toBeFocused()
  if (!isMobile) { await page.keyboard.press('ArrowRight'); await expect.poll(() => target(vertical).evaluate(e => e.scrollLeft)).toBeGreaterThan(0) }
  const tap = await scene(page, 'touch-action', 'optimize-tap-controls')
  await expect(target(tap)).toHaveCSS('touch-action', 'manipulation')
  const checkbox = tap.getByRole('checkbox', { name: 'Show grid' }); await checkbox.focus(); await page.keyboard.press('Space'); await expect(checkbox).toBeChecked()
  const demo = example(page, 'touch-action', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 390); await expect(target(frame)).toHaveCSS('touch-action', 'auto')
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('touch-action', 'pan-y pinch-zoom')
})

test('native drag examples use loaded media and real vendor or HTML requests', async ({ page, browserName }) => {
  await page.goto('/en/reference/user-drag')
  const base = await scene(page, 'user-drag', 'prevent-dragging-media')
  await expect(target(base, 0)).toHaveCSS('-webkit-user-drag', 'none'); await expect(target(base, 1)).toHaveCSS('-webkit-user-drag', 'auto')
  await expect(target(base, 2)).toHaveAttribute('draggable', 'false')
  for (const image of await base.getByRole('img').all()) await expect.poll(() => image.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBeGreaterThan(0)
  if (browserName === 'chromium') {
    for (const i of [0, 1, 2]) await nativeDrag(page, target(base, i))
    await expect(base.locator('[data-drag-readout="example-0-target"]')).toHaveText('No start observed')
    await expect(base.locator('[data-drag-readout="example-1-target"]')).toContainText('1 start')
    await expect(base.locator('[data-drag-readout="example-2-target"]')).toHaveText('No start observed')
  }
  const explicit = await scene(page, 'user-drag', 'keep-draggable-elements-explicit')
  await expect(target(explicit, 0)).toHaveCSS('-webkit-user-drag', 'element'); await expect(target(explicit, 1)).toHaveAttribute('draggable', 'true')
  const demo = example(page, 'user-drag', 'reset-to-browser-behavior'), frame = await ready(demo)
  await viewport(demo, 390); await expect(target(frame)).toHaveCSS('-webkit-user-drag', 'none')
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('-webkit-user-drag', 'auto')
  const lock = await scene(page, 'user-drag', 'apply-conditionally'), checkbox = lock.getByRole('checkbox', { name: 'Lock image dragging' })
  await checkbox.focus(); await page.keyboard.press('Space'); await expect(target(lock)).toHaveCSS('-webkit-user-drag', 'none')
  await page.keyboard.press('Space'); await expect(target(lock)).toHaveCSS('-webkit-user-drag', 'auto')
})

test('selection uses actual content and stable native state controls', async ({ page, browserName }) => {
  await page.goto('/en/reference/user-select')
  const none = await scene(page, 'user-select', 'disable-selection-on-controls')
  await expect(target(none)).toHaveCSS('user-select', 'none')
  await none.getByRole('checkbox').focus(); await page.keyboard.press('Space'); await expect(none.getByRole('checkbox')).toBeChecked()
  const all = await scene(page, 'user-select', 'select-all-text-in-one-click')
  await expect(target(all)).toHaveText('pnpm install @master/css'); await expect(target(all)).toHaveCSS('user-select', 'all')
  if (browserName === 'chromium') { await target(all).dblclick(); expect(await selected(target(all))).toBe('pnpm install @master/css') }
  const text = await scene(page, 'user-select', 'preserve-normal-reading-selection')
  await expect(target(text)).toHaveCSS('user-select', 'text')
  if (browserName === 'chromium') { await target(text).dblclick(); const value = await selected(target(text)); expect(value.length).toBeGreaterThan(0); expect(value.length).toBeLessThan((await target(text).textContent())!.length) }
  const conditional = await scene(page, 'user-select', 'apply-conditionally'), checkbox = conditional.getByRole('checkbox', { name: 'Protect text from selection' })
  await checkbox.focus(); await page.keyboard.press('Space'); await expect(target(conditional)).toHaveCSS('user-select', 'none')
  await page.keyboard.press('Space'); await expect(target(conditional)).toHaveCSS('user-select', 'text')
})

for (const route of routes) {
  test(`interactions composition: ${route}`, async ({ page }, testInfo) => {
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
      for (const control of await frame.locator('input,textarea,select,button,summary').filter({ visible: true }).all()) await expect(control).toHaveAccessibleName(/.+/)
      const missing = await frame.locator('[aria-describedby]').evaluateAll(elements => elements.flatMap(e => e.getAttribute('aria-describedby')!.split(/\s+/).filter(id => !e.ownerDocument.getElementById(id))))
      expect(missing).toEqual([])
      for (const image of await frame.locator('img').all()) await expect.poll(() => image.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBeGreaterThan(0)
      await demo.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 96))
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      await demo.screenshot({ path: testInfo.outputPath(`demo-${index}.png`), scale: 'css', caret: 'initial' })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    expect(failures).toEqual([])
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true, scale: 'css', caret: 'initial' })
  })
}
