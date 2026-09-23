import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { documentHeadings } from '../../reference/headings'
import { configuredExampleCSS, configuredMarkupClasses } from '../../reference/configured-example'
import { deliveryFences, deliverySlugs, deliverySource, routeStyles } from '../delivery-examples'

const previousHeadings = JSON.parse(readFileSync(new URL('../delivery-heading-ids.json', import.meta.url), 'utf8')) as Record<string, { id: string }[]>

for (const slug of deliverySlugs) test(`complete delivery guide ${slug}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`/en/guide/${slug}`)
  for (const heading of [...documentHeadings(deliverySource(slug)), ...previousHeadings[slug]]) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  for (const table of await page.locator('.doc-table').all()) expect(await table.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath(`${slug}.png`), fullPage: true, scale: 'css', caret: 'initial', style: 'nav.app-wrapper, nextjs-portal{visibility:hidden}' })
  expect(errors).toEqual([])
})

test('local route CSS compiles real container, focus, viewport and reduced motion behavior', async ({ page, browserName }) => {
  const css = await routeStyles()
  const html = deliveryFences(deliverySource('route-level-styles')).filter(f => f.language === 'html').map(f => f.text).join('\n')
  await page.setContent(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0} ${css}</style>${html}<h1 class="home-hero">Project overview</h1>`)
  const button = page.getByRole('button', { name: 'Create project' })
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await expect(button).toBeFocused()
  await expect(button).toHaveCSS('outline-width', '2px')
  await expect(button).toHaveAttribute('type', 'button')
  for (const [width, count] of [[671, 1], [672, 3]]) {
    await page.locator('.home-feature-grid').evaluate((e, width) => { (e as HTMLElement).style.width = `${width}px` }, width)
    expect(await page.locator('.home-feature-list').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(count)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  expect((await button.boundingBox())!.width).toBe(390)
  await page.setViewportSize({ width: 1600, height: 900 })
  expect((await button.boundingBox())!.width).toBeLessThan(400)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.home-hero')).toHaveCSS('animation-name', 'none')
  await expect(button).toHaveCSS('transition-duration', '0s')
})

test('runtime values retain a literal scanned class and respond to the real viewport', async ({ page }) => {
  const html = deliveryFences(deliverySource('rendering-modes')).find(f => f.language === 'html' && f.text.includes('font-size:var(--size)'))!.text
  const css = configuredExampleCSS('', configuredMarkupClasses(html))
  await page.setContent(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style>${html}`)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByText('Preview title')).toHaveCSS('font-size', '16px')
  await page.setViewportSize({ width: 1600, height: 900 })
  await expect(page.getByText('Preview title')).toHaveCSS('font-size', '32px')
})

test('document flow gallery retains ordered text and optional caption variants', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/en/design-system#document-flow')
  for (const [title, count] of [['Runtime delivery', 3], ['Publish a document', 2]] as const) {
    const flow = page.getByRole('figure', { name: title, exact: true })
    await expect(flow.getByRole('listitem')).toHaveCount(count)
    await expect(flow.locator('button, input, a')).toHaveCount(0)
    expect(await flow.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
    const cards = await flow.locator('li').evaluateAll(es => es.map(e => ({ x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y })))
    if (info.project.name.startsWith('mobile')) expect(cards.every(c => c.x === cards[0].x)).toBe(true)
    else expect(cards.every(c => c.y === cards[0].y)).toBe(true)
    expect(await flow.evaluate(e => Math.abs(e.clientWidth - e.querySelector('figcaption')!.getBoundingClientRect().width))).toBeLessThan(1)
    await flow.screenshot({ path: info.outputPath(`${title === 'Runtime delivery' ? 'flow-caption' : 'flow-plain'}.png`), scale: 'css', caret: 'initial', style: 'nav.app-wrapper, nextjs-portal{visibility:hidden}' })
  }
  expect(errors).toEqual([])
})
