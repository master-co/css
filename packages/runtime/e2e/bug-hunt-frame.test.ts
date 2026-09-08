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

for (const kind of ['document', 'shadow'] as const) {
  test(`BH-0009 handles iframe ${kind} subtree addition, attributes, moves and removal`, async ({ page }) => {
    await init(page)
    const result = await page.evaluate(async ({ manifest, kind }) => {
      const frame = document.createElement('iframe')
      document.body.appendChild(frame)
      const owner = frame.contentDocument!
      const host = owner.createElement('section')
      owner.body.append(host)
      const root = kind === 'shadow' ? host.attachShadow({ mode: 'open' }) : owner
      const container = kind === 'shadow' ? root as ShadowRoot : owner.body
      const runtime = await globalThis.MasterCSSRuntime.start({ root, manifest })
      const flush = () => new Promise<void>(resolve => {
        frame.contentWindow!.requestAnimationFrame(() => frame.contentWindow!.requestAnimationFrame(() => frame.contentWindow!.requestAnimationFrame(() => resolve())))
      })
      try {
        runtime.observe()
        const subtree = owner.createElement('div')
        subtree.className = 'block'
        const child = owner.createElementNS('http://www.w3.org/2000/svg', 'svg')
        child.setAttribute('class', 'block')
        subtree.append(child, owner.createTextNode('text'), owner.createComment('hidden'))
        container.append(subtree)
        await flush()
        const added = runtime.snapshot().usageCounts
        child.setAttribute('class', 'hidden')
        await flush()
        const changed = runtime.snapshot().usageCounts
        const display = owner.defaultView!.getComputedStyle(child).display
        const secondParent = owner.createElement('article')
        container.append(secondParent)
        secondParent.append(subtree)
        await flush()
        const moved = runtime.snapshot().usageCounts
        secondParent.remove()
        await flush()
        const removed = runtime.snapshot().usageCounts
        return { added, changed, display, moved, removed }
      } finally {
        runtime.dispose()
        frame.remove()
      }
    }, { manifest: defaultManifestJSON as unknown as MasterCSSManifest, kind })
    expect(result).toEqual({ added: { block: 2 }, changed: { block: 1, hidden: 1 }, display: 'none', moved: { block: 1, hidden: 1 }, removed: {} })
  })
}
