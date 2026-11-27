import { expect, test } from '@playwright/test'
import init, { compileProgram } from './init'

test('BH-0009 tracks class updates in a same-origin iframe Document root', async ({ page }) => {
  await init(page)
  const result = await page.evaluate(async (program) => {
    const frame = document.createElement('iframe')
    document.body.appendChild(frame)
    const root = frame.contentDocument!
    const element = root.createElement('div')
    element.className = "(display:block)"
    root.body.appendChild(element)
    const runtime = await globalThis.MasterCSSRuntime.start({ root, program })
    try {
      runtime.observe()
      const before = runtime.snapshot().usageCounts
      element.className = "(display:none)"
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      return { before, after: runtime.snapshot().usageCounts }
    } finally {
      runtime.dispose()
      frame.remove()
    }
  }, compileProgram())
  expect(result.before).toEqual({ '(display:block)': 1 })
  expect(result.after).toEqual({ '(display:none)': 1 })
})

for (const kind of ['document', 'shadow'] as const) {
  test(`BH-0009 handles iframe ${kind} subtree addition, attributes, moves and removal`, async ({ page }) => {
    await init(page)
    const result = await page.evaluate(async ({ program, kind }) => {
      const frame = document.createElement('iframe')
      document.body.appendChild(frame)
      const owner = frame.contentDocument!
      const host = owner.createElement('section')
      owner.body.append(host)
      const root = kind === 'shadow' ? host.attachShadow({ mode: 'open' }) : owner
      const container = kind === 'shadow' ? root as ShadowRoot : owner.body
      const runtime = await globalThis.MasterCSSRuntime.start({ root, program })
      const flush = () => new Promise<void>(resolve => {
        frame.contentWindow!.requestAnimationFrame(() => frame.contentWindow!.requestAnimationFrame(() => frame.contentWindow!.requestAnimationFrame(() => resolve())))
      })
      try {
        runtime.observe()
        const subtree = owner.createElement('div')
        subtree.className = "(display:block)"
        const child = owner.createElementNS('http://www.w3.org/2000/svg', 'svg')
        child.setAttribute('class', "(display:block)")
        subtree.append(child, owner.createTextNode('text'), owner.createComment("(display:none)"))
        container.append(subtree)
        await flush()
        const added = runtime.snapshot().usageCounts
        child.setAttribute('class', "(display:none)")
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
    }, { program: compileProgram(), kind })
    expect(result).toEqual({ added: { '(display:block)': 2 }, changed: { '(display:block)': 1, '(display:none)': 1 }, display: 'none', moved: { '(display:block)': 1, '(display:none)': 1 }, removed: {} })
  })
}

test('starts on an XHTML document as a document root, not a shadow root', async ({ page }) => {
  await init(page)
  const result = await page.evaluate(async (program) => {
    const frame = document.createElement('iframe')
    const xhtml = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body><div class="(display:none)"></div></body></html>'
    frame.src = URL.createObjectURL(new Blob([xhtml], { type: 'application/xhtml+xml' }))
    // Some engines fire `load` for the initial blank document first.
    await new Promise<void>((resolve) => {
      frame.addEventListener('load', function loaded() {
        if (frame.contentDocument?.contentType !== 'application/xhtml+xml') return
        frame.removeEventListener('load', loaded)
        resolve()
      })
      document.body.appendChild(frame)
    })
    const root = frame.contentDocument!
    const runtime = await globalThis.MasterCSSRuntime.start({ root, program })
    try {
      runtime.observe()
      return {
        contentType: root.contentType,
        usage: runtime.snapshot().usageCounts,
        display: frame.contentWindow!.getComputedStyle(root.querySelector('div')!).display
      }
    } finally {
      runtime.dispose()
      frame.remove()
    }
  }, compileProgram())
  // Chromium and WebKit name it `XMLDocument`, which a constructor-name check missed.
  expect(result.contentType).toBe('application/xhtml+xml')
  expect(result.usage).toEqual({ '(display:none)': 1 })
  expect(result.display).toBe('none')
})
