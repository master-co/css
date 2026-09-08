import { expect, test } from '@playwright/test'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import init from './init'

test('BH-0009 tracks class updates in a same-origin iframe Document root', async ({ page }) => {
  await init(page)
  const result = await page.evaluate(async (manifest) => {
    const frame = document.createElement('iframe')
    document.body.appendChild(frame)
    const root = frame.contentDocument!
    const element = root.createElement('div')
    element.className = 'block'
    root.body.appendChild(element)
    const runtime = await globalThis.MasterCSSRuntime.start({ root, manifest })
    try {
      runtime.observe()
      const before = runtime.snapshot().usageCounts
      element.className = 'hidden'
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      return { before, after: runtime.snapshot().usageCounts }
    } finally {
      runtime.dispose()
      frame.remove()
    }
  }, defaultManifestJSON as unknown as MasterCSSManifest)
  expect(result.before).toEqual({ block: 1 })
  expect(result.after).toEqual({ hidden: 1 })
})
