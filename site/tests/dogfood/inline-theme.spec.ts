import { expect, test, type Page } from '@playwright/test'

test('inline mode tokens resolve without emitting inline resources', async ({ page }) => {
  const failures = capturePageFailures(page)
  await page.goto('/en/guide/introduction')
  const raised = page.locator('[class~="surface:raised"]').first()
  await raised.waitFor({ state: 'attached' })

  const light = await readRaisedThemeState(page, raised, 'light')
  expect(light.surfaceRaised).not.toBe('')
  expect(light.white).toBe('')
  expect(light.background).toBe(light.expectedBackground)
  expect(light.cssText).not.toContain('--color-white:')
  expect(light.cssText).not.toContain('var(--color-white)')

  const dark = await readRaisedThemeState(page, raised, 'dark')
  expect(dark.surfaceRaised).not.toBe('')
  expect(dark.white).toBe('')
  expect(dark.background).toBe(dark.expectedBackground)
  expect(dark.cssText).not.toContain('--color-white:')
  expect(dark.cssText).not.toContain('var(--color-white)')
  expect(failures).toEqual([])
})

async function readRaisedThemeState(
  page: Page,
  raised: ReturnType<Page['locator']>,
  mode: 'light' | 'dark'
) {
  await page.evaluate((nextMode) => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(nextMode)
  }, mode)
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ))

  return raised.evaluate((element, currentMode) => {
    const rootStyle = getComputedStyle(document.documentElement)
    const probe = document.createElement('div')
    probe.style.backgroundColor = currentMode === 'light'
      ? 'oklch(100% 0 none)'
      : 'var(--color-gray-90)'
    document.body.append(probe)
    const expectedBackground = getComputedStyle(probe).backgroundColor
    probe.remove()
    const cssText = [...document.styleSheets, ...document.adoptedStyleSheets]
      .flatMap((stylesheet) => {
        try {
          return [...stylesheet.cssRules].map((rule) => rule.cssText)
        } catch {
          return []
        }
      })
      .join('\n')
    return {
      background: getComputedStyle(element).backgroundColor,
      cssText,
      expectedBackground,
      surfaceRaised: rootStyle.getPropertyValue('--color-surface-raised').trim(),
      white: rootStyle.getPropertyValue('--color-white').trim()
    }
  }, mode)
}

function capturePageFailures(page: Page) {
  const failures: string[] = []
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`)
  })
  return failures
}
