// https://github.com/master-co/css/issues/383

import { test, expect, type Page } from '@playwright/test'
import init from '../../e2e/init'

async function waitForRuntimeRemovalFlush(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
  }))
}

test('383', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div class="text-center"></div>
    `
  })
  await init(page)
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.utilitiesLayer?.native?.parentStyleSheet)).toBeDefined()
  await page.evaluate(() => {
    document.body.innerHTML = ``
  })
  await waitForRuntimeRemovalFlush(page)
  const retained = await page.evaluate(() => ({
    retainedClassNames: [...globalThis.masterCSSRuntime.retainedClassNames],
    hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('text-center'),
    utilitiesStyleSheet: globalThis.masterCSSRuntime.utilitiesLayer?.native?.parentStyleSheet
  }))
  expect(retained.retainedClassNames).toEqual(['text-center'])
  expect(retained.hasClassUtility).toBe(true)
  expect(retained.utilitiesStyleSheet).toBeDefined()

  const afterForcedCleanup = await page.evaluate(() => ({
    removedCount: globalThis.masterCSSRuntime.flushRetainedClassRules(),
    retainedClassNames: [...globalThis.masterCSSRuntime.retainedClassNames],
    hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('text-center'),
    utilitiesStyleSheet: globalThis.masterCSSRuntime.utilitiesLayer?.native?.parentStyleSheet
  }))
  expect(afterForcedCleanup).toEqual({
    removedCount: 1,
    retainedClassNames: [],
    hasClassUtility: false,
    utilitiesStyleSheet: null
  })
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div class="font:bold fg:red"></div>
    `
  })
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.utilitiesLayer?.native?.parentStyleSheet)).toBeDefined()
})
