import { test, expect } from '@playwright/test'
import init from '../init'

test('progressive', async ({ page }) => {
  await init(page)
  expect(await page.evaluate(() => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    runtime.dispose()
    runtime.dispose()
    return {
      globalCleared: globalThis.__MASTER_CSS_RUNTIME_TEST__ === undefined,
      styleRemoved: !document.getElementById('master-css')
    }
  })).toEqual({
    globalCleared: true,
    styleRemoved: true
  })
})
