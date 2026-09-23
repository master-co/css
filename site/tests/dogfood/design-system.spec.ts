import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const headings = JSON.parse(readFileSync(new URL('../final-page-heading-ids.json', import.meta.url), 'utf8')) as Record<string, string[]>
const screenshot = { caret: 'initial' as const, scale: 'css' as const, style: 'nav.app-wrapper,nextjs-portal{visibility:hidden}' }

test('categorized catalog preserves anchors, keyboard access and every real recipe', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/en/design-system')
  for (const id of headings['/design-system']) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1)
  const navigation = page.getByRole('navigation', { name: 'Design system sections', exact: true })
  const targets = await navigation.locator('a').evaluateAll(links => links.map(link => {
    const target = document.querySelector(link.getAttribute('href')!)
    return target ? target.getBoundingClientRect().top : null
  }))
  expect(targets.every(target => target !== null)).toBe(true)
  expect(targets).toEqual([...targets].sort((a, b) => a! - b!))
  const platform = navigation.getByRole('link', { name: 'Platform behavior' })
  await platform.focus()
  await platform.press('Enter')
  await expect(page).toHaveURL(/#platform-behavior$/)
  await page.evaluate(() => document.fonts.ready)
  await navigation.screenshot({ path: info.outputPath('navigation.png'), ...screenshot })
  await expect(page.locator('.demo-catalog-group')).toHaveCount(9)
  await expect(page.locator('details.demo-recipe')).toHaveCount(87)
  await expect(page.locator('details.demo-recipe[open]')).toHaveCount(0)
  for (const [index, group] of (await page.locator('.demo-catalog-group').all()).entries()) {
    const entries = group.locator('details.demo-recipe')
    const count = await entries.count()
    await expect(group.locator('h3 > span')).toHaveText(`${count} recipes`)
    await group.screenshot({ path: info.outputPath(`category-${index}.png`), ...screenshot })
    for (const [recipeIndex, entry] of (await entries.all()).entries()) {
      const summary = entry.locator('summary')
      await expect(summary).toHaveAccessibleName(/\w/)
      await summary.focus()
      await summary.press(recipeIndex % 2 ? 'Space' : 'Enter')
      await expect(entry).toHaveAttribute('open', '')
      expect(await summary.locator('span').nth(1).evaluate(element => element.getBoundingClientRect().width / element.parentElement!.getBoundingClientRect().width)).toBeGreaterThan(.5)
      const frame = entry.locator('iframe')
      await frame.scrollIntoViewIfNeeded()
      await expect(frame).toHaveAttribute('data-ready', 'true')
      const demoCase = await entry.locator('[data-demo-case]').getAttribute('data-demo-case')
      await expect(entry.getByRole('link', { name: 'Read the example and source' })).toHaveAttribute('href', `/reference/${demoCase}`)
      await expect(frame).toHaveAttribute('title', /\w/)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      await entry.screenshot({ path: info.outputPath(`recipe-${index}-${recipeIndex}.png`), ...screenshot })
      await summary.focus()
      await summary.press('Enter')
      await expect(entry).not.toHaveAttribute('open')
      await expect(summary).toBeFocused()
    }
  }
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({ path: info.outputPath('design-system.png'), fullPage: true, ...screenshot })
  expect(errors).toEqual([])
})

test('component gallery loads every visible preview and preserves document geometry', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/en/design-system')
  await page.evaluate(() => document.fonts.ready)
  for (const artwork of await page.locator('.prose img:visible').all()) {
    await artwork.scrollIntoViewIfNeeded()
    await expect.poll(() => artwork.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
  }
  const previews = page.locator('iframe:visible')
  expect(await previews.count()).toBeGreaterThan(20)
  for (const [index, frame] of (await previews.all()).entries()) {
    await frame.scrollIntoViewIfNeeded()
    await expect(frame).toHaveAttribute('data-ready', 'true')
    await expect(frame).toHaveAttribute('title', /\w/)
    const demo = frame.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " site-demo ")][1]')
    await demo.screenshot({ path: info.outputPath(`component-${index}.png`), ...screenshot })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  // A native definition list is queried by its authored label across engines.
  const definitions = page.locator('dl[aria-label="Demo component interfaces"]')
  await expect(definitions.locator('dt')).toHaveCount(18)
  for (const [index, entry] of (await definitions.locator('.doc-option').all()).entries()) {
    await entry.scrollIntoViewIfNeeded()
    expect(await entry.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await entry.screenshot({ path: info.outputPath(`interface-${index}.png`), ...screenshot })
  }
  await page.evaluate(() => scrollTo(0, 0))
  await page.screenshot({ path: info.outputPath('complete-gallery.png'), fullPage: true, ...screenshot })
  expect(errors).toEqual([])
})
