import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { documentHeadings } from '../../reference/headings'
import { deliverySource } from '../delivery-examples'
import { agentPrompt, agentFixExample } from '../../utils/agent-guide-data'

const previous = JSON.parse(readFileSync(new URL('../guide-agentic-heading-ids.json', import.meta.url), 'utf8')) as Record<string, { id: string }[]>
const captureStyle = 'nav.app-wrapper,nextjs-portal{visibility:hidden}'
function errorsFor(page: Page) {
  const errors: string[] = []
  page.on('pageerror', event => errors.push(event.message))
  page.on('console', event => { if (event.type() === 'error') errors.push(event.text()) })
  return errors
}
for (const slug of ['ai-coding', 'mcp-server']) test(`complete agent guide ${slug}`, async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto(`/en/guide/${slug}`)
  for (const heading of [...documentHeadings(deliverySource(slug)), ...previous[slug]]) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  for (const row of await page.locator('.doc-option').all()) {
    await row.scrollIntoViewIfNeeded()
    expect(await row.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    const description = row.locator('dd p')
    expect((await description.boundingBox())!.width).toBeGreaterThan(250)
  }
  for (const prompt of await page.locator('[data-agent-prompt]').all()) {
    await prompt.scrollIntoViewIfNeeded()
    const name = (await prompt.getAttribute('data-agent-prompt'))!
    expect(await prompt.locator('pre').textContent()).toBe(agentPrompt(name).text)
    expect(await prompt.locator('pre').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await prompt.screenshot({ path: info.outputPath(`prompt-${name}.png`), scale: 'css', caret: 'initial', style: captureStyle })
  }
  for (const pre of await page.locator('main pre').all()) if (await pre.isVisible()) await pre.scrollIntoViewIfNeeded()
  for (const iframe of await page.locator('main iframe').all()) if (await iframe.isVisible()) {
    await iframe.scrollIntoViewIfNeeded()
    await expect(iframe).toHaveAttribute('data-ready', 'true')
  }
  const fix = page.locator('[data-agent-fix-example]')
  if (await fix.count()) {
    expect((await fix.locator('pre code').first().innerText()).trim()).toBe(agentFixExample.source)
    expect((await fix.locator('pre code').last().innerText()).trim()).toBe(agentFixExample.result)
  }
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath(`${slug}.png`), fullPage: true, scale: 'css', caret: 'initial', style: captureStyle })
  expect(errors).toEqual([])
})

test('prompt copying preserves full text and keyboard feedback', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { document.body.dataset.copiedText = text } } })
  })
  await page.goto('/en/guide/ai-coding')
  const prompt = page.locator('[data-agent-prompt="context"]')
  const button = prompt.getByRole('button', { name: `Copy ${agentPrompt('context').title}`, exact: true })
  await button.focus(); await page.keyboard.press('Enter')
  await expect(button).toBeFocused()
  await expect(button).toHaveCSS('outline-width', '2px')
  await expect(page.locator('body')).toHaveAttribute('data-copied-text', agentPrompt('context').text)
  await expect(prompt.getByRole('status')).toHaveText(`${agentPrompt('context').title} copied`)
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }) })
  await page.keyboard.press('Enter')
  await expect(prompt.getByRole('status')).toContainText('Clipboard unavailable')
  await expect(prompt.getByRole('status')).toBeVisible()
  await prompt.screenshot({ path: info.outputPath('prompt-clipboard-unavailable.png'), scale: 'css', caret: 'initial', style: captureStyle })
  expect(errors).toEqual([])
})

test('project vocabulary preserves native button states', async ({ page, browserName }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/guide/ai-coding')
  const demo = page.locator('[data-project-style="agent-project-vocabulary"]')
  await demo.scrollIntoViewIfNeeded()
  const iframe = demo.locator('iframe').first()
  await expect(iframe).toHaveAttribute('data-ready', 'true')
  const frame = demo.frameLocator('iframe').first()
  const save = frame.getByRole('button', { name: 'Save changes', exact: true })
  const disabled = frame.getByRole('button', { name: 'Saving…', exact: true })
  await expect(save).toBeVisible()
  await expect(disabled).toBeDisabled()
  await expect(disabled).toHaveCSS('opacity', '0.5')
  await expect(save).toHaveCSS('height', '40px')
  await iframe.focus()
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await expect(save).toBeFocused()
  await expect(save).toHaveCSS('outline-width', '2px')
  await expect(save).toHaveCSS('outline-offset', '3px')
  await demo.screenshot({ path: info.outputPath('project-button-focus.png'), scale: 'css', caret: 'initial', style: captureStyle })
  const background = await save.evaluate(element => getComputedStyle(element).backgroundColor)
  await save.hover()
  expect(await save.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(background)
  expect(await frame.locator('html').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})

test('agent documentation gallery composes wrapped prose and native examples', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/design-system#agent-documentation')
  const gallery = page.locator('[data-agent-gallery]')
  await expect(gallery).toBeVisible()
  for (const [index, item] of (await gallery.locator('[data-agent-prompt], [data-agent-workflow], [data-agent-fix-example], [data-project-style]').all()).entries()) {
    await item.scrollIntoViewIfNeeded()
    for (const pre of await item.locator('pre').all()) await pre.scrollIntoViewIfNeeded()
    for (const iframe of await item.locator('iframe').all()) await expect(iframe).toHaveAttribute('data-ready', 'true')
    await item.screenshot({ path: info.outputPath(`gallery-${index}.png`), scale: 'css', caret: 'initial', style: captureStyle })
  }
  expect(await gallery.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})
