import { test, expect, type Page } from '@playwright/test'
import { createEngineSync } from '@master/css/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  type MasterCSSHydrationManifest,
  serializeMasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import init, { getRuntimeLoaderURL } from './init'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function renderHydration(...classNames: string[]) {
  const engine = createEngineSync({ manifest: defaultManifest })
  try {
    engine.ensureClassRules(classNames)
    const snapshot = engine.snapshot()
    return {
      text: snapshot.text,
      hydrationManifest: {
        version: 1 as const,
        rules: snapshot.rules,
        resourceOrder: [
          ...snapshot.resources.variables.map(({ name }) => name),
          ...snapshot.resources.animations.map(({ name }) => name)
        ]
      }
    }
  } finally {
    engine.dispose()
  }
}

async function startCSSRuntimeAsync(
  page: Page,
  hydrationManifest?: MasterCSSHydrationManifest,
  loaderURL?: string
) {
  await page.evaluate(async ({ loaderURL, hydrationManifest }) => {
    const { startCSSRuntimeAsync } = await import(loaderURL)
    await startCSSRuntimeAsync({ hydrationManifest })
  }, { loaderURL: loaderURL || await getRuntimeLoaderURL(), hydrationManifest })
  await page.waitForFunction(() => !!globalThis.__MASTER_CSS_RUNTIME_TEST__)
}

async function gotoRuntimeOrigin(page: Page, loaderURL: string) {
  const blankURL = new URL('/__master-css-runtime-e2e.html', loaderURL).href
  await page.route(blankURL, route => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><html><head></head><body></body></html>'
  }))
  await page.goto(blankURL)
}

async function waitForRuntimeRemovalFlush(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
  }))
}

async function waitForRuntimeRuleFlush(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  }))
}

test('disconnect clears counts and observe rescans the current DOM', async ({ page }) => {
  await init(page)
  await page.evaluate(async () => {
    document.body.innerHTML = '<div class="block"></div>'
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  expect(await page.evaluate(() => Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts))).toEqual({
    block: 1
  })

  const disconnected = await page.evaluate(async () => {
    globalThis.__MASTER_CSS_RUNTIME_TEST__.disconnect()
    document.body.innerHTML = '<div class="font:bold"></div>'
    await new Promise(resolve => setTimeout(resolve, 0))
    return {
      counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
      hasStyle: !!document.head.querySelector('style#master-css')
    }
  })
  expect(disconnected).toEqual({
    counts: {},
    hasStyle: false
  })

  const reconnected = await page.evaluate(async () => {
    globalThis.__MASTER_CSS_RUNTIME_TEST__.observe()
    await new Promise(resolve => setTimeout(resolve, 0))
    return {
      counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
      text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
    }
  })
  expect(reconnected.counts).toEqual({
    'font:bold': 1
  })
  expect(reconnected.text).toContain(':root{--font-weight-bold:700}')
  expect(reconnected.text).toContain('.font\\:bold{font-weight:var(--font-weight-bold)}')
  expect(reconnected.text).not.toContain('.block{display:block}')
})

test('mutation removals keep counts immediate and retain CSSOM rules after settle', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
  })
  await waitForRuntimeRuleFlush(page)

  const duringFlushWindow = await page.evaluate(async () => {
    document.getElementById('target')?.remove()
    await new Promise(resolve => setTimeout(resolve, 0))
    return {
      counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
      hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
      text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
    }
  })
  expect(duringFlushWindow.counts).toEqual({})
  expect(duringFlushWindow.hasClassUtility).toBe(true)
  expect(duringFlushWindow.text).toContain('.fg\\:red-60')

  await waitForRuntimeRemovalFlush(page)
  const afterFlush = await page.evaluate(() => ({
    counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
    hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
    retainedClassNames: [...globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames],
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
  }))
  expect(afterFlush).toEqual({
    counts: {},
    hasClassUtility: true,
    retainedClassNames: ['fg:red-60'],
    text: expect.stringContaining('.fg\\:red-60')
  })

  const afterForcedCleanup = await page.evaluate(() => ({
    removedCount: globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules(),
    counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
    retainedClassNames: [...globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames],
    hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
  }))
  expect(afterForcedCleanup).toEqual({
    removedCount: 1,
    counts: {},
    retainedClassNames: [],
    hasClassUtility: false,
    text: ''
  })
})

test('mutation removal flush keeps remaining native CSSOM references valid', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.body.innerHTML = [
      '<p id="keep" class="fg:blue-60"></p>',
      '<p id="target" class="fg:red-60 bg:green-60 animation:fade|1s"></p>'
    ].join('')
  })
  await waitForRuntimeRuleFlush(page)

  await page.evaluate(() => {
    document.getElementById('target')?.remove()
  })
  await waitForRuntimeRemovalFlush(page)

  const afterBatchFlush = await page.evaluate(() => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    const sheetText = Array.from(runtime.style!.sheet!.cssRules)
      .map((cssRule) => cssRule.cssText)
      .join('\n')
    return {
      classUtilities: [...runtime.classUtilities.keys()],
      retainedClassNames: [...runtime.retainedClassNames],
      themeCounts: Object.fromEntries(runtime.themeLayer.tokenCounts),
      animationCounts: Object.fromEntries(runtime.animationsNonLayer.tokenCounts),
      text: runtime.text,
      sheetText
    }
  })
  expect(afterBatchFlush.classUtilities).toEqual(['fg:blue-60', 'fg:red-60', 'bg:green-60', 'animation:fade|1s'])
  expect(afterBatchFlush.retainedClassNames).toEqual(['fg:red-60', 'bg:green-60', 'animation:fade|1s'])
  expect(afterBatchFlush.themeCounts).toEqual({
    'color-blue-60': 1,
    'color-red-60': 1,
    'color-green-60': 1
  })
  expect(afterBatchFlush.animationCounts).toEqual({
    fade: 1
  })
  expect(afterBatchFlush.text).toContain('.fg\\:blue-60')
  expect(afterBatchFlush.text).toContain('.fg\\:red-60')
  expect(afterBatchFlush.text).toContain('.bg\\:green-60')
  expect(afterBatchFlush.text).toContain('@keyframes fade')
  expect(afterBatchFlush.sheetText).toContain('.fg\\:blue-60')
  expect(afterBatchFlush.sheetText).toContain('.fg\\:red-60')
  expect(afterBatchFlush.sheetText).toContain('.bg\\:green-60')
  expect(afterBatchFlush.sheetText).toContain('@keyframes fade')

  const afterForcedCleanup = await page.evaluate(() => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    const removedCount = runtime.flushRetainedClassRules()
    const sheetText = Array.from(runtime.style!.sheet!.cssRules)
      .map((cssRule) => cssRule.cssText)
      .join('\n')
    return {
      removedCount,
      classUtilities: [...runtime.classUtilities.keys()],
      retainedClassNames: [...runtime.retainedClassNames],
      themeCounts: Object.fromEntries(runtime.themeLayer.tokenCounts),
      animationCounts: Object.fromEntries(runtime.animationsNonLayer.tokenCounts),
      text: runtime.text,
      sheetText
    }
  })
  expect(afterForcedCleanup.removedCount).toBe(3)
  expect(afterForcedCleanup.classUtilities).toEqual(['fg:blue-60'])
  expect(afterForcedCleanup.retainedClassNames).toEqual([])
  expect(afterForcedCleanup.themeCounts).toEqual({
    'color-blue-60': 1
  })
  expect(afterForcedCleanup.animationCounts).toEqual({})
  expect(afterForcedCleanup.text).toContain('.fg\\:blue-60')
  expect(afterForcedCleanup.text).not.toContain('.fg\\:red-60')
  expect(afterForcedCleanup.text).not.toContain('.bg\\:green-60')
  expect(afterForcedCleanup.text).not.toContain('@keyframes fade')
  expect(afterForcedCleanup.sheetText).toContain('.fg\\:blue-60')
  expect(afterForcedCleanup.sheetText).not.toContain('.fg\\:red-60')
  expect(afterForcedCleanup.sheetText).not.toContain('.bg\\:green-60')
  expect(afterForcedCleanup.sheetText).not.toContain('@keyframes fade')

  const afterDirectMutation = await page.evaluate(() => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    runtime.ensureClassRules(['block'])
    runtime.deleteClassRules(['fg:blue-60'])
    const sheetText = Array.from(runtime.style!.sheet!.cssRules)
      .map((cssRule) => cssRule.cssText)
      .join('\n')
    return {
      classUtilities: [...runtime.classUtilities.keys()],
      themeCounts: Object.fromEntries(runtime.themeLayer.tokenCounts),
      text: runtime.text,
      sheetText
    }
  })
  expect(afterDirectMutation.classUtilities).toEqual(['block'])
  expect(afterDirectMutation.themeCounts).toEqual({})
  expect(afterDirectMutation.text).toBe('@layer utilities{.block{display:block}}')
  expect(afterDirectMutation.sheetText).toContain('.block')
  expect(afterDirectMutation.sheetText).not.toContain('.fg\\:blue-60')
})

test('re-adding a retained class cancels retained cleanup', async ({ page }) => {
  await init(page)
  await page.evaluate(async () => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
    document.getElementById('target')?.remove()
  })
  await waitForRuntimeRemovalFlush(page)

  const afterReadd = await page.evaluate(async () => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
    await new Promise(resolve => setTimeout(resolve, 0))
    const removedCount = globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules()
    return {
      removedCount,
      counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
      retainedClassNames: [...globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames],
      hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
      text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
    }
  })
  expect(afterReadd.counts).toEqual({
    'fg:red-60': 1
  })
  expect(afterReadd.removedCount).toBe(0)
  expect(afterReadd.retainedClassNames).toEqual([])
  expect(afterReadd.hasClassUtility).toBe(true)
  expect(afterReadd.text).toContain('.fg\\:red-60')
})

test('direct remove deletes retained CSSOM rules synchronously', async ({ page }) => {
  await init(page)
  await page.evaluate(async () => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
    await new Promise(resolve => setTimeout(resolve, 0))
    document.getElementById('target')?.remove()
  })
  await waitForRuntimeRemovalFlush(page)

  const afterDirectRemove = await page.evaluate(() => {
    globalThis.__MASTER_CSS_RUNTIME_TEST__.deleteClassRules(['fg:red-60'])
    return {
      retainedClassNames: [...globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames],
      hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
      text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
    }
  })
  expect(afterDirectRemove).toEqual({
    retainedClassNames: [],
    hasClassUtility: false,
    text: ''
  })
})

test('retained hard-limit cleanup returns to soft target and preserves active classes', async ({ page }) => {
  await init(page)
  const result = await page.evaluate(async () => {
    const idleCallbacks = new Map<number, IdleRequestCallback>()
    const nativeRequestIdleCallback = window.requestIdleCallback
    const nativeCancelIdleCallback = window.cancelIdleCallback
    let nextIdleHandle = 1
    window.requestIdleCallback = (callback) => {
      const handle = nextIdleHandle++
      idleCallbacks.set(handle, callback)
      return handle
    }
    window.cancelIdleCallback = (handle) => {
      idleCallbacks.delete(handle)
    }
    const waitFrames = (count: number) => new Promise<void>((resolve) => {
      const step = () => {
        if (count <= 0) {
          resolve()
          return
        }
        count--
        requestAnimationFrame(step)
      }
      step()
    })
    const flushIdleCallbacks = () => {
      const callbacks = [...idleCallbacks]
      idleCallbacks.clear()
      for (const [, callback] of callbacks) {
        callback({
          didTimeout: false,
          timeRemaining: () => 50
        })
      }
    }

    try {
      const wrapper = document.createElement('section')
      for (let index = 0; index < 520; index++) {
        const element = document.createElement('p')
        element.className = `z:${index}`
        wrapper.append(element)
      }
      document.body.innerHTML = '<p class="fg:blue-60"></p>'
      document.body.append(wrapper)
      await waitFrames(2)
      wrapper.remove()
      await waitFrames(3)

      const beforeHardLimitCleanup = {
        counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
        retainedCount: globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames.size,
        retainedHasReusedClass: globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames.has('z:0'),
        queuedIdleCount: idleCallbacks.size
      }

      const reused = document.createElement('p')
      reused.className = 'z:0'
      document.body.append(reused)
      await new Promise(resolve => setTimeout(resolve, 0))
      const afterReuseBeforeCleanup = {
        counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
        retainedCount: globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames.size,
        retainedHasReusedClass: globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames.has('z:0'),
        hasReusedClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('z:0'),
        hasActiveClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:blue-60'),
        queuedIdleCount: idleCallbacks.size
      }

      flushIdleCallbacks()
      const afterHardLimitCleanup = {
        counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
        retainedCount: globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames.size,
        retainedHasReusedClass: globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames.has('z:0'),
        hasReusedClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('z:0'),
        hasActiveClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:blue-60'),
        text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text,
        queuedIdleCount: idleCallbacks.size
      }

      const afterForcedCleanup = {
        removedCount: globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules(),
        retainedCount: globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames.size,
        counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
        hasReusedClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('z:0'),
        hasActiveClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:blue-60'),
        text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
      }

      return {
        beforeHardLimitCleanup,
        afterReuseBeforeCleanup,
        afterHardLimitCleanup,
        afterForcedCleanup
      }
    } finally {
      window.requestIdleCallback = nativeRequestIdleCallback
      window.cancelIdleCallback = nativeCancelIdleCallback
    }
  })
  expect(result.beforeHardLimitCleanup.counts).toEqual({
    'fg:blue-60': 1
  })
  expect(result.beforeHardLimitCleanup.retainedCount).toBe(520)
  expect(result.beforeHardLimitCleanup.retainedHasReusedClass).toBe(true)
  expect(result.beforeHardLimitCleanup.queuedIdleCount).toBe(1)

  expect(result.afterReuseBeforeCleanup.counts).toEqual({
    'fg:blue-60': 1,
    'z:0': 1
  })
  expect(result.afterReuseBeforeCleanup.retainedCount).toBe(519)
  expect(result.afterReuseBeforeCleanup.retainedHasReusedClass).toBe(false)
  expect(result.afterReuseBeforeCleanup.hasReusedClassUtility).toBe(true)
  expect(result.afterReuseBeforeCleanup.hasActiveClassUtility).toBe(true)
  expect(result.afterReuseBeforeCleanup.queuedIdleCount).toBe(1)

  expect(result.afterHardLimitCleanup.counts).toEqual({
    'fg:blue-60': 1,
    'z:0': 1
  })
  expect(result.afterHardLimitCleanup.retainedCount).toBeLessThanOrEqual(128)
  expect(result.afterHardLimitCleanup.retainedCount).toBeGreaterThan(0)
  expect(result.afterHardLimitCleanup.retainedHasReusedClass).toBe(false)
  expect(result.afterHardLimitCleanup.hasReusedClassUtility).toBe(true)
  expect(result.afterHardLimitCleanup.hasActiveClassUtility).toBe(true)
  expect(result.afterHardLimitCleanup.text).toContain('.fg\\:blue-60')
  expect(result.afterHardLimitCleanup.text).toContain('.z\\:0')
  expect(result.afterHardLimitCleanup.queuedIdleCount).toBe(0)

  expect(result.afterForcedCleanup.removedCount).toBe(result.afterHardLimitCleanup.retainedCount)
  expect(result.afterForcedCleanup.retainedCount).toBe(0)
  expect(result.afterForcedCleanup.counts).toEqual({
    'fg:blue-60': 1,
    'z:0': 1
  })
  expect(result.afterForcedCleanup.hasReusedClassUtility).toBe(true)
  expect(result.afterForcedCleanup.hasActiveClassUtility).toBe(true)
  expect(result.afterForcedCleanup.text).toContain('.fg\\:blue-60')
  expect(result.afterForcedCleanup.text).toContain('.z\\:0')
  expect(result.afterForcedCleanup.text).not.toContain('.z\\:1')
})

test('mutation removals are canceled when a class returns before flush', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
  })
  await waitForRuntimeRuleFlush(page)

  const duringFlushWindow = await page.evaluate(async () => {
    const target = document.getElementById('target')!
    target.remove()
    await new Promise(resolve => setTimeout(resolve, 0))
    document.body.append(target)
    await new Promise(resolve => setTimeout(resolve, 0))
    return {
      counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
      hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60')
    }
  })
  expect(duringFlushWindow).toEqual({
    counts: {
      'fg:red-60': 1
    },
    hasClassUtility: true
  })

  await waitForRuntimeRemovalFlush(page)
  const afterFlush = await page.evaluate(() => ({
    counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
    hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
  }))
  expect(afterFlush.counts).toEqual({
    'fg:red-60': 1
  })
  expect(afterFlush.hasClassUtility).toBe(true)
  expect(afterFlush.text).toContain('.fg\\:red-60')
})

test('direct ensureClassRules and deleteClassRules stay synchronous', async ({ page }) => {
  await init(page)

  const result = await page.evaluate(async () => {
    globalThis.__MASTER_CSS_RUNTIME_TEST__.ensureClassRules(['fg:red-60'])
    const added = {
      hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
      text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
    }
    globalThis.__MASTER_CSS_RUNTIME_TEST__.deleteClassRules(['fg:red-60'])
    return {
      added,
      removed: {
        hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
        text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
      }
    }
  })

  expect(result.added.hasClassUtility).toBe(true)
  expect(result.added.text).toContain('.fg\\:red-60')
  expect(result.removed).toEqual({
    hasClassUtility: false,
    text: ''
  })
})

test('observer-added cold classes update counts immediately and flush rules before paint', async ({ page }) => {
  await init(page)

  const result = await page.evaluate(async () => {
    const queuedFrames = new Map<number, FrameRequestCallback>()
    const nativeRequestAnimationFrame = window.requestAnimationFrame
    const nativeCancelAnimationFrame = window.cancelAnimationFrame
    let nextFrameHandle = 1
    window.requestAnimationFrame = (callback) => {
      const handle = nextFrameHandle++
      queuedFrames.set(handle, callback)
      return handle
    }
    window.cancelAnimationFrame = (handle) => {
      queuedFrames.delete(handle)
    }

    try {
      const target = document.createElement('p')
      target.className = 'fg:red-60'
      document.body.append(target)
      await new Promise(resolve => setTimeout(resolve, 0))

      const beforeFlush = {
        queuedFrameCount: queuedFrames.size,
        counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
        hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
        text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
      }

      for (const callback of queuedFrames.values()) {
        callback(performance.now())
      }
      queuedFrames.clear()

      const afterFlush = {
        counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
        hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
        text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
      }

      return { beforeFlush, afterFlush }
    } finally {
      window.requestAnimationFrame = nativeRequestAnimationFrame
      window.cancelAnimationFrame = nativeCancelAnimationFrame
    }
  })

  expect(result.beforeFlush).toEqual({
    queuedFrameCount: 1,
    counts: {
      'fg:red-60': 1
    },
    hasClassUtility: false,
    text: ''
  })
  expect(result.afterFlush.counts).toEqual({
    'fg:red-60': 1
  })
  expect(result.afterFlush.hasClassUtility).toBe(true)
  expect(result.afterFlush.text).toContain('.fg\\:red-60')
})

test('observer-added retained classes are reused immediately', async ({ page }) => {
  await init(page)
  await page.evaluate(async () => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
    document.getElementById('target')?.remove()
  })
  await waitForRuntimeRemovalFlush(page)

  const result = await page.evaluate(async () => {
    const queuedFrames = new Map<number, FrameRequestCallback>()
    const nativeRequestAnimationFrame = window.requestAnimationFrame
    const nativeCancelAnimationFrame = window.cancelAnimationFrame
    let nextFrameHandle = 1
    window.requestAnimationFrame = (callback) => {
      const handle = nextFrameHandle++
      queuedFrames.set(handle, callback)
      return handle
    }
    window.cancelAnimationFrame = (handle) => {
      queuedFrames.delete(handle)
    }

    try {
      document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
      await new Promise(resolve => setTimeout(resolve, 0))
      return {
        queuedFrameCount: queuedFrames.size,
        counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
        retainedClassNames: [...globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames],
        hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
        text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
      }
    } finally {
      window.requestAnimationFrame = nativeRequestAnimationFrame
      window.cancelAnimationFrame = nativeCancelAnimationFrame
    }
  })

  expect(result.counts).toEqual({
    'fg:red-60': 1
  })
  expect(result.queuedFrameCount).toBe(0)
  expect(result.retainedClassNames).toEqual([])
  expect(result.hasClassUtility).toBe(true)
  expect(result.text).toContain('.fg\\:red-60')
})

test('observer queued cold classes removed before flush are skipped', async ({ page }) => {
  await init(page)

  const result = await page.evaluate(async () => {
    const queuedFrames = new Map<number, FrameRequestCallback>()
    const nativeRequestAnimationFrame = window.requestAnimationFrame
    const nativeCancelAnimationFrame = window.cancelAnimationFrame
    let nextFrameHandle = 1
    window.requestAnimationFrame = (callback) => {
      const handle = nextFrameHandle++
      queuedFrames.set(handle, callback)
      return handle
    }
    window.cancelAnimationFrame = (handle) => {
      queuedFrames.delete(handle)
    }

    try {
      const target = document.createElement('p')
      target.className = 'z:1234'
      document.body.append(target)
      await new Promise(resolve => setTimeout(resolve, 0))
      target.remove()
      await new Promise(resolve => setTimeout(resolve, 0))

      const beforeFlush = {
        queuedFrameCount: queuedFrames.size,
        counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
        hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('z:1234'),
        text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
      }

      for (const callback of queuedFrames.values()) {
        callback(performance.now())
      }
      queuedFrames.clear()

      return {
        beforeFlush,
        afterFlush: {
          counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts),
          hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('z:1234'),
          text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
        }
      }
    } finally {
      window.requestAnimationFrame = nativeRequestAnimationFrame
      window.cancelAnimationFrame = nativeCancelAnimationFrame
    }
  })

  expect(result.beforeFlush.queuedFrameCount).toBeGreaterThanOrEqual(0)
  expect(result.beforeFlush).toMatchObject({
    counts: {},
    hasClassUtility: false,
    text: ''
  })
  expect(result.afterFlush).toEqual({
    counts: {},
    hasClassUtility: false,
    text: ''
  })
})

test('disconnect and dispose clear pending mutation additions and removals', async ({ page }) => {
  await init(page)
  const disconnected = await page.evaluate(async () => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p><p class="z:1234"></p>'
    await new Promise(resolve => setTimeout(resolve, 0))
    document.getElementById('target')?.remove()
    await new Promise(resolve => setTimeout(resolve, 0))
    globalThis.__MASTER_CSS_RUNTIME_TEST__.disconnect()
    const snapshot = globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot()
    return {
      counts: snapshot.usageCounts,
      classRules: snapshot.classRules,
      hasStyle: !!document.head.querySelector('style#master-css')
    }
  })
  expect(disconnected).toEqual({
    counts: {},
    classRules: {},
    hasStyle: false
  })
  await waitForRuntimeRemovalFlush(page)
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().classRules)).toEqual({})

  await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.observe())
  const disposed = await page.evaluate(async (manifest) => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p><p class="z:1234"></p>'
    await new Promise(resolve => setTimeout(resolve, 0))
    document.getElementById('target')?.remove()
    await new Promise(resolve => setTimeout(resolve, 0))
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    runtime.dispose()
    const replacement = await globalThis.MasterCSSRuntime.start({ manifest })
    const replaced = replacement !== runtime
    replacement.dispose()
    return {
      replaced,
      globalRuntime: globalThis.masterCSSRuntime,
      hasStyle: !!document.head.querySelector('style#master-css')
    }
  }, defaultManifest)
  expect(disposed).toEqual({
    replaced: true,
    globalRuntime: undefined,
    hasStyle: false
  })
  await waitForRuntimeRemovalFlush(page)
})

test('shadow roots maintain isolated runtime state and style nodes', async ({ page }) => {
  await init(page)

  const result = await page.evaluate(async (manifest) => {
    const host = document.createElement('section')
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = '<p class="block"></p>'
    document.body.append(host)

    const shadowRuntime = await globalThis.MasterCSSRuntime.start({
      root: shadow,
      manifest
    })
    shadowRuntime.observe()
    const shadowSnapshot = shadowRuntime.snapshot()
    const documentSnapshot = globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot()
    const instanceRegistered = await globalThis.MasterCSSRuntime.start({
      root: shadow,
      manifest
    }) === shadowRuntime
    const shadowHasStyle = !!shadow.querySelector('style#master-css')
    shadowRuntime.dispose()

    return {
      documentCounts: documentSnapshot.usageCounts,
      documentHasBlockRule: documentSnapshot.cssText.includes('.block{display:block}'),
      shadowCounts: shadowSnapshot.usageCounts,
      shadowHasStyle,
      shadowStyleRemoved: !shadow.querySelector('style#master-css'),
      shadowText: shadowSnapshot.cssText,
      instanceRegistered
    }
  }, defaultManifest)

  expect(result).toEqual({
    documentCounts: {},
    documentHasBlockRule: false,
    shadowCounts: { block: 1 },
    shadowHasStyle: true,
    shadowStyleRemoved: true,
    shadowText: '@layer utilities{.block{display:block}}',
    instanceRegistered: true
  })
})

test('progressive hydration without a manifest rebuilds with runtime CSS', async ({ page }) => {
  const consoleWarnings: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning') consoleWarnings.push(message.text())
  })

  await page.evaluate(() => {
    document.body.innerHTML = '<div class="block"></div>'
  })
  await init(page, '@layer utilities{.unknown{color:red}}')

  const result = await page.evaluate(() => ({
    progressive: globalThis.__MASTER_CSS_RUNTIME_TEST__.progressive,
    ruleNames: globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.map(({ name }) => name),
    nativeRules: Array.from(globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.native?.cssRules || []).map((rule) => rule.cssText),
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
  }))

  expect(consoleWarnings.some((message) => message.includes('hydration manifest'))).toBe(true)
  expect(result.progressive).toBe(false)
  expect(result.ruleNames).toEqual(['block'])
  expect(result.nativeRules.some((text) => text.includes('.unknown'))).toBe(false)
  expect(result.nativeRules.some((text) => text.includes('.block'))).toBe(true)
  expect(result.text).toBe('@layer utilities{.block{display:block}}')
})

test('progressive hydration with a mismatched manifest rebuilds with runtime CSS', async ({ page }) => {
  const { hydrationManifest } = renderHydration('fg:red-60', 'bg:red-60')
  const prerenderedCSS = renderHydration('fg:red-60')
  const consoleWarnings: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning') consoleWarnings.push(message.text())
  })

  await page.evaluate(() => {
    document.body.innerHTML = '<p class="fg:red-60"></p>'
  })
  await init(page, prerenderedCSS.text, undefined, hydrationManifest)

  const result = await page.evaluate(() => ({
    progressive: globalThis.__MASTER_CSS_RUNTIME_TEST__.progressive,
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text,
    utilityRules: globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.map(({ name }) => name)
  }))

  expect(consoleWarnings.some((message) => message.includes('hydration manifest'))).toBe(true)
  expect(result.progressive).toBe(false)
  expect(result.utilityRules).toEqual(['fg:red-60'])
  expect(result.text).toContain('.fg\\:red-60')
  expect(result.text).not.toContain('.bg\\:red-60')
})

test('progressive hydration with an empty manifest rebuilds with runtime CSS', async ({ page }) => {
  const consoleWarnings: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning') consoleWarnings.push(message.text())
  })

  await page.evaluate(() => {
    document.body.innerHTML = '<p class="block"></p>'
  })
  await init(page, '@layer utilities{.block{display:block}}', undefined, {
    version: 1,
    rules: [],
    resourceOrder: []
  })

  const result = await page.evaluate(() => ({
    progressive: globalThis.__MASTER_CSS_RUNTIME_TEST__.progressive,
    utilityRules: globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.map(({ name }) => name),
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
  }))

  expect(consoleWarnings.some((message) => message.includes('Hydration manifest has no generated rules'))).toBe(true)
  expect(result).toEqual({
    progressive: false,
    utilityRules: ['block'],
    text: '@layer utilities{.block{display:block}}'
  })
})

test('progressive hydration uses hydration manifest and retains removed hydrated classes', async ({ page }) => {
  const { text, hydrationManifest } = renderHydration('fg:red-60')

  await page.evaluate(() => {
    document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
  })
  await init(page, text, undefined, hydrationManifest)

  const hydrated = await page.evaluate(() => {
    const rule = globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.find((eachRule) => eachRule.name === 'fg:red-60') as any
    return {
      hasClassUtility: globalThis.__MASTER_CSS_RUNTIME_TEST__.classUtilities.has('fg:red-60'),
      hasRegisteredUtility: Boolean(rule?.registeredUtility),
      counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.tokenCounts),
      utilityRules: globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.map(({ name }) => name)
    }
  })
  expect(hydrated).toEqual({
    hasClassUtility: true,
    hasRegisteredUtility: false,
    counts: {
      'color-red-60': 1
    },
    utilityRules: ['fg:red-60']
  })

  const removed = await page.evaluate(async () => {
    document.getElementById('target')?.classList.remove('fg:red-60')
    await new Promise(resolve => setTimeout(resolve, 0))
    return {
      text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text,
      counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.tokenCounts),
      utilityRules: globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.map(({ name }) => name)
    }
  })
  expect(removed.utilityRules).toEqual(['fg:red-60'])

  await waitForRuntimeRemovalFlush(page)
  const afterFlush = await page.evaluate(() => ({
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text,
    counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.tokenCounts),
    retainedClassNames: [...globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames],
    utilityRules: globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.map(({ name }) => name)
  }))
  expect(afterFlush).toEqual({
    text: expect.stringContaining('.fg\\:red-60'),
    counts: {
      'color-red-60': 1
    },
    retainedClassNames: ['fg:red-60'],
    utilityRules: ['fg:red-60']
  })

  const afterForcedCleanup = await page.evaluate(() => ({
    removedCount: globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules(),
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text,
    counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.tokenCounts),
    retainedClassNames: [...globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames],
    utilityRules: globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.map(({ name }) => name)
  }))
  expect(afterForcedCleanup).toEqual({
    removedCount: 1,
    text: '',
    counts: {},
    retainedClassNames: [],
    utilityRules: []
  })
})

test('progressive hydration imports an external style hydration manifest', async ({ page }) => {
  const { text, hydrationManifest } = renderHydration('fg:red-60')
  const loaderURL = await getRuntimeLoaderURL()
  const source = new URL('/_master-css/hydration/external.json', loaderURL).href

  await gotoRuntimeOrigin(page, loaderURL)
  await page.route(source, route => route.fulfill({
    status: 200,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*'
    },
    body: serializeMasterCSSHydrationManifest(hydrationManifest)
  }))
  await page.evaluate(({ attr, runtimeStyleId, source, text }) => {
    document.body.innerHTML = '<p class="fg:red-60"></p>'
    const style = document.createElement('style')
    style.id = runtimeStyleId
    style.textContent = text
    style.setAttribute(attr, source)
    document.head.append(style)
  }, {
    attr: MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID,
    source,
    text
  })
  await startCSSRuntimeAsync(page, undefined, loaderURL)

  const result = await page.evaluate(() => ({
    progressive: globalThis.__MASTER_CSS_RUNTIME_TEST__.progressive,
    utilityRules: globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.map(({ name }) => name),
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
  }))

  expect(result.progressive).toBe(true)
  expect(result.utilityRules).toEqual(['fg:red-60'])
  expect(result.text).toContain('.fg\\:red-60')
})

test('runtime start does not import a hydration manifest without a runtime style source', async ({ page }) => {
  let requests = 0
  const loaderURL = await getRuntimeLoaderURL()
  const source = new URL('/_master-css/hydration/unreferenced.json', loaderURL).href

  await page.route(source, route => {
    requests++
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"version":1,"rules":[]}'
    })
  })
  await page.evaluate(() => {
    document.body.innerHTML = '<p class="block"></p>'
  })
  await startCSSRuntimeAsync(page, undefined, loaderURL)

  const result = await page.evaluate(() => ({
    progressive: globalThis.__MASTER_CSS_RUNTIME_TEST__.progressive,
    observing: globalThis.__MASTER_CSS_RUNTIME_TEST__.observing,
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
  }))

  expect(requests).toBe(0)
  expect(result).toEqual({
    progressive: false,
    observing: true,
    text: '@layer utilities{.block{display:block}}'
  })
})

test('progressive hydration fails open when an external style hydration manifest import fails', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  const source = new URL('/_master-css/hydration/missing.json', loaderURL).href

  await gotoRuntimeOrigin(page, loaderURL)
  await page.route(source, route => route.fulfill({
    status: 404,
    body: 'not found'
  }))
  await page.evaluate(({ attr, runtimeStyleId, source }) => {
    document.body.innerHTML = '<p class="block"></p>'
    const style = document.createElement('style')
    style.id = runtimeStyleId
    style.textContent = '@layer utilities{.block{display:block}}'
    style.setAttribute(attr, source)
    document.head.append(style)
  }, {
    attr: MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID,
    source
  })
  const result = await page.evaluate(async ({ loaderURL, runtimeStyleId }) => {
    const { startCSSRuntimeAsync } = await import(loaderURL)
    try {
      await startCSSRuntimeAsync()
    } catch (error) {
      return {
        code: (error as { code?: string }).code,
        hidden: document.documentElement.hasAttribute('hidden'),
        runtimeStarted: Boolean(globalThis.__MASTER_CSS_RUNTIME_TEST__),
        styleText: document.getElementById(runtimeStyleId)?.textContent
      }
    }
    throw new Error('Expected runtime startup to fail.')
  }, { loaderURL, runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID })

  expect(result).toEqual({
    code: 'INVALID_HYDRATION_MANIFEST',
    hidden: false,
    runtimeStarted: false,
    styleText: '@layer utilities{.block{display:block}}'
  })
})

test('progressive hydration rejects an invalid external hydration manifest payload', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  const source = new URL('/_master-css/hydration/invalid.json', loaderURL).href

  await gotoRuntimeOrigin(page, loaderURL)
  await page.route(source, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{invalid'
  }))
  await page.evaluate(({ attr, runtimeStyleId, source }) => {
    document.body.innerHTML = '<p class="block"></p>'
    const style = document.createElement('style')
    style.id = runtimeStyleId
    style.textContent = '@layer utilities{.block{display:block}}'
    style.setAttribute(attr, source)
    document.head.append(style)
  }, {
    attr: MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID,
    source
  })

  const result = await page.evaluate(async ({ loaderURL }) => {
    const { startCSSRuntimeAsync } = await import(loaderURL)
    try {
      await startCSSRuntimeAsync()
    } catch (error) {
      return {
        code: (error as { code?: string }).code,
        runtimeStarted: Boolean(globalThis.__MASTER_CSS_RUNTIME_TEST__)
      }
    }
    throw new Error('Expected runtime startup to fail.')
  }, { loaderURL })

  expect(result).toEqual({
    code: 'INVALID_HYDRATION_MANIFEST',
    runtimeStarted: false
  })
})

test('explicit hydration manifest wins over external DOM discovery', async ({ page }) => {
  const { text, hydrationManifest } = renderHydration('fg:red-60')
  let requests = 0
  const loaderURL = await getRuntimeLoaderURL()
  const source = new URL('/_master-css/hydration/ignored.json', loaderURL).href

  await page.route(source, route => {
    requests++
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"version":1,"rules":[]}'
    })
  })
  await page.evaluate(({ attr, runtimeStyleId, source, text }) => {
    document.body.innerHTML = '<p class="fg:red-60"></p>'
    const style = document.createElement('style')
    style.id = runtimeStyleId
    style.textContent = text
    style.setAttribute(attr, source)
    document.head.append(style)
  }, {
    attr: MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID,
    source,
    text
  })
  await startCSSRuntimeAsync(page, hydrationManifest, loaderURL)

  const result = await page.evaluate(() => ({
    progressive: globalThis.__MASTER_CSS_RUNTIME_TEST__.progressive,
    utilityRules: globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.map(({ name }) => name),
  }))

  expect(requests).toBe(0)
  expect(result.progressive).toBe(true)
  expect(result.utilityRules).toEqual(['fg:red-60'])
})

test('progressive hydration matches bucketed theme variables', async ({ page }) => {
  const { text, hydrationManifest } = renderHydration('fg:red-60', 'bg:blue-60')
  const consoleWarnings: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning') consoleWarnings.push(message.text())
  })

  await page.evaluate(() => {
    document.body.innerHTML = '<p class="fg:red-60 bg:blue-60"></p>'
  })
  await init(page, text, undefined, hydrationManifest)

  const result = await page.evaluate(() => ({
    progressive: globalThis.__MASTER_CSS_RUNTIME_TEST__.progressive,
    counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.tokenCounts),
    nativeThemeRuleCount: globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.native?.cssRules.length,
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
  }))

  expect(consoleWarnings.filter((message) => message.includes('hydration manifest'))).toEqual([])
  expect(result.progressive).toBe(true)
  expect(result.counts).toEqual({
    'color-red-60': 1,
    'color-blue-60': 1
  })
  expect(result.nativeThemeRuleCount).toBe(1)
  expect(result.text).toContain('--color-red-60')
  expect(result.text).toContain('--color-blue-60')
})

test('progressive hydration matches theme variable buckets by key', async ({ page }) => {
  const consoleWarnings: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning') consoleWarnings.push(message.text())
  })

  await page.evaluate(() => {
    document.body.innerHTML = '<p class="fg:primary"></p>'
  })
  await init(
    page,
    '@layer theme{.dark{color-scheme:dark;--color-primary:#ffffff}.light,:root{color-scheme:light;--color-primary:#000000}}@layer utilities{.fg\\:primary{color:var(--color-primary)}}',
    {
      variables: [
        { namespace: 'color', key: 'primary', value: '#000000', mode: 'light' },
        { namespace: 'color', key: 'primary', value: '#ffffff', mode: 'dark' }
      ],
      modes: ['light', 'dark'],
      modeTrigger: 'class'
    },
    'auto'
  )

  const result = await page.evaluate(() => ({
    progressive: globalThis.__MASTER_CSS_RUNTIME_TEST__.progressive,
    counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.tokenCounts),
    nativeThemeRuleCount: globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.native?.cssRules.length,
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
  }))

  expect(consoleWarnings.filter((message) => message.includes('hydration manifest'))).toEqual([])
  expect(result.progressive).toBe(true)
  expect(result.counts).toEqual({
    'color-primary': 1
  })
  expect(result.nativeThemeRuleCount).toBe(2)
  expect(result.text).toContain('.light,:root{color-scheme:light;--color-primary:#000000}')
  expect(result.text).toContain('.dark{color-scheme:dark;--color-primary:#ffffff}')
})

test('removes shared alias variable dependencies when classes disappear', async ({ page }) => {
  await init(page, '', {
    variables: [
      { key: 'surface', value: '#ffffff' },
      { key: 'brand', value: 'var(--surface)', dependencies: ['surface'] }
    ]
  })

  await page.evaluate(() => {
    const el = document.createElement('p')
    el.classList.add('fg:brand', 'color:brand')
    document.body.append(el)
  })
  await waitForRuntimeRuleFlush(page)
  const initial = await page.evaluate(() => ({
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.text,
    counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.tokenCounts)
  }))
  expect(initial).toEqual({
    text: '@layer theme{:root{--brand:var(--surface);--surface:#ffffff}}',
    counts: {
      brand: 2,
      surface: 2
    }
  })

  await page.evaluate(() => {
    document.querySelector('p')?.classList.remove('fg:brand')
  })
  await waitForRuntimeRemovalFlush(page)
  const afterOneRemoval = await page.evaluate(() => ({
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.text,
    counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.tokenCounts),
    retainedClassNames: [...globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames]
  }))
  expect(afterOneRemoval).toEqual({
    text: '@layer theme{:root{--brand:var(--surface);--surface:#ffffff}}',
    counts: {
      brand: 2,
      surface: 2
    },
    retainedClassNames: ['fg:brand']
  })

  await page.evaluate(() => {
    document.querySelector('p')?.classList.remove('color:brand')
  })
  await waitForRuntimeRemovalFlush(page)
  const afterAllRemoved = await page.evaluate(() => ({
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.text,
    counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.tokenCounts),
    retainedClassNames: [...globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames],
    nativeAttached: !!globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.native?.parentStyleSheet
  }))
  expect(afterAllRemoved).toEqual({
    text: '@layer theme{:root{--brand:var(--surface);--surface:#ffffff}}',
    counts: {
      brand: 2,
      surface: 2
    },
    retainedClassNames: ['fg:brand', 'color:brand'],
    nativeAttached: true
  })

  const afterForcedCleanup = await page.evaluate(() => ({
    removedCount: globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules(),
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.text,
    counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.tokenCounts),
    retainedClassNames: [...globalThis.__MASTER_CSS_RUNTIME_TEST__.retainedClassNames],
    nativeAttached: !!globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.native?.parentStyleSheet
  }))
  expect(afterForcedCleanup).toEqual({
    removedCount: 2,
    text: '',
    counts: {},
    retainedClassNames: [],
    nativeAttached: false
  })
})

test('inlines variables without runtime theme counts', async ({ page }) => {
  await init(page, '', {
    variables: [
      { namespace: 'color', key: 'brand', value: '#123456', inline: true }
    ]
  })

  const result = await page.evaluate(async () => {
    document.body.innerHTML = '<p class="fg:brand"></p>'
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
    return {
      text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text,
      counts: Object.fromEntries(globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.tokenCounts)
    }
  })

  expect(result).toEqual({
    text: '@layer utilities{.fg\\:brand{color:#123456}}',
    counts: {}
  })
})
