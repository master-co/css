import { test, expect } from '@playwright/test'
import init from './init'

test('keeps default variable buckets before mode buckets when CSSOM buckets are inserted later', async ({ page }) => {
  await init(page, '', {
    variables: [
      { namespace: 'color', key: 'blue', values: [{ path: [".light"], value: '#66f' }] },
      { namespace: 'color', key: 'blue', values: [{ path: [".dark"], value: '#44f' }] },
      { namespace: 'color', key: 'accent', values: [{ path: [':root,:host'], value: 'var(--color-blue)' }], dependencies: ['color-blue'] },
      { namespace: 'color', key: 'accent', values: [{ path: [".dark"], value: '#fed' }] }
    ]
  })

  const result = await page.evaluate(async () => {
    const waitForRuntimeRuleFlush = () => new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
    document.documentElement.classList.add('dark')
    const dependency = document.createElement('p')
    dependency.className = 'fg-blue'
    document.body.append(dependency)
    await waitForRuntimeRuleFlush()
    const target = document.createElement('p')
    target.className = 'fg-accent'
    document.body.append(target)
    await waitForRuntimeRuleFlush()
    const sheet = document.querySelector<HTMLStyleElement>('style#master-css')?.sheet
    const themeRule = sheet
      ? Array.from(sheet.cssRules).map((rule) => rule.cssText).find((text) => text.includes('@layer theme')) || ''
      : ''
    return {
      color: getComputedStyle(target).color,
      themeRule
    }
  })

  expect(result.color).toBe('rgb(255, 238, 221)')
  expect(result.themeRule.indexOf(':root')).toBeLessThan(result.themeRule.indexOf('.dark'))
  expect(result.themeRule).toContain('--color-accent: #fed')
})
