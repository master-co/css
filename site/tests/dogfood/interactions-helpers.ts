import { expect, type FrameLocator, type Locator, type Page } from '@playwright/test'

export const routes = ['accent-color', 'appearance', 'caret-color', 'cursor', 'pointer-events', 'resize', 'screen-readers', 'touch-action', 'user-drag', 'user-select']
export const example = (page: Page, route: string, section: string) => page.locator(`[data-demo-case="${route}#${section}"]`)
export const target = (frame: FrameLocator, index?: number) => frame.locator(`#${index === undefined ? '' : `example-${index}-`}target`)
export async function ready(demo: Locator) {
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  await demo.locator('iframe').evaluate(async (element: HTMLIFrameElement) => { await element.contentDocument!.fonts.ready })
  return demo.frameLocator('iframe')
}
export async function scene(page: Page, route: string, section: string) { return ready(example(page, route, section)) }
export async function viewport(demo: Locator, width: number) {
  await demo.getByLabel('Viewport', { exact: true }).fill(String(width))
  await expect.poll(() => demo.locator('iframe').evaluate(e => e.clientWidth)).toBe(width)
}
export async function clickAt(page: Page, element: Locator, touch = false) {
  await element.scrollIntoViewIfNeeded()
  const box = (await element.boundingBox())!
  if (touch) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
  else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
}
export async function nativeDrag(page: Page, element: Locator) {
  await element.scrollIntoViewIfNeeded()
  const box = (await element.boundingBox())!, x = box.x + box.width / 3, y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 16, y + 8, { steps: 4 })
  await page.mouse.move(x + 64, y + 20, { steps: 8 })
  // Observe a genuine drag start without dropping a URL onto the document.
  await page.keyboard.press('Escape')
  await page.mouse.up()
}
export async function resizeHandle(page: Page, element: Locator, dx = 40, dy = 32) {
  await element.scrollIntoViewIfNeeded()
  const box = (await element.boundingBox())!
  await page.mouse.move(box.x + box.width - 3, box.y + box.height - 3)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width - 3 + dx, box.y + box.height - 3 + dy, { steps: 12 })
  await page.mouse.up()
  return { before: box, after: (await element.boundingBox())! }
}
export async function selected(element: Locator) { return element.evaluate(e => e.ownerDocument.getSelection()?.toString() ?? '') }
