import { test, expect } from '@playwright/test'
import init from '../init'

test('progressive', async ({ page }) => {
  await init(page)
  expect(await page.evaluate(() => {
    const runtime = globalThis.masterCSSRuntime
    runtime.destroy()
    runtime.destroy()
    return {
      globalCleared: globalThis.masterCSSRuntime === undefined,
      styleRemoved: !document.getElementById('master-css')
    }
  })).toEqual({
    globalCleared: true,
    styleRemoved: true
  })
})
