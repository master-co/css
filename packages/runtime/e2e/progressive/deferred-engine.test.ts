import { expect, test, type Page } from '@playwright/test'
import { renderClassNamesSync } from '@master/css/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
  serializeMasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import { getRuntimeLoaderURL } from '../init'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const wasmRequest = /mastercss_binding_wasm_engine_bg\.wasm(?:\?.*)?$/
const engineRequest = /\/packages\/css\/dist\/|_bg\.wasm/

interface PrerenderedPage {
  readonly loaderURL: string
  readonly requests: string[]
}

/** Serves a progressive page whose CSS and hydration manifest cover `classNames`. */
async function openPrerenderedPage(
  page: Page,
  body: string,
  classNames: string[],
  transformCSS: (cssText: string) => string = cssText => cssText,
  manifest: MasterCSSManifest = defaultManifest
): Promise<PrerenderedPage> {
  const loaderURL = await getRuntimeLoaderURL()
  const pageURL = new URL('/__master-css-deferred-engine.html', loaderURL).href
  const { cssText, hydrationManifest } = renderClassNamesSync(classNames, { manifest })
  await page.route(pageURL, route => route.fulfill({
    contentType: 'text/html',
    body: [
      '<!doctype html><html><head>',
      `<style id="${MASTER_CSS_RUNTIME_STYLE_ID}">${transformCSS(cssText)}</style>`,
      `<script type="application/json" id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}">${serializeMasterCSSHydrationManifest(hydrationManifest)}</script>`,
      `</head><body>${body}</body></html>`
    ].join('')
  }))
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.goto(pageURL)
  return { loaderURL, requests }
}

async function startDeferredRuntime(page: Page, loaderURL: string, options: Record<string, unknown> = {}) {
  await page.evaluate(async ({ loaderURL, options }) => {
    const { startCSSRuntime } = await import(loaderURL)
    await startCSSRuntime({ lazyManifest: true, ready: false, ...options })
  }, { loaderURL, options })
}

async function waitForFrames(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  }))
}

async function waitForEngine(page: Page, state: 'ready' | 'failed') {
  await page.waitForFunction(state => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().engine === state, state)
}

function engineRequests(requests: string[]) {
  return requests.filter(url => engineRequest.test(url))
}

test('keeps a fully pre-rendered page off the engine, its Wasm and the project manifest', async ({ page }) => {
  const { loaderURL, requests } = await openPrerenderedPage(
    page,
    '<p id="target" class="fg-red-60"></p><p id="other"></p>',
    ['fg-red-60', 'display:block']
  )
  await startDeferredRuntime(page, loaderURL)
  await page.evaluate(() => document.getElementById('other')!.classList.add('display:block'))
  await waitForFrames(page)

  expect(await page.evaluate(() => {
    const snapshot = globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot()
    return {
      engine: snapshot.engine,
      binding: snapshot.binding ?? null,
      observing: snapshot.observing,
      hydration: snapshot.hydration.state,
      usageCounts: snapshot.usageCounts,
      ruleCounts: Object.fromEntries(Object.entries(snapshot.classRules).map(([className, { rules }]) => [className, rules.length])),
      prerendered: snapshot.cssText.includes('.fg-red-60'),
      manifestLoads: globalThis.__MASTER_CSS_RUNTIME_MANIFEST_LOADS__,
      color: getComputedStyle(document.getElementById('target')!).color,
      display: getComputedStyle(document.getElementById('other')!).display
    }
  })).toEqual({
    engine: 'deferred',
    binding: null,
    observing: true,
    hydration: 'progressive',
    usageCounts: { 'display:block': 1, 'fg-red-60': 1 },
    // Rules come from the engine, so a deferred runtime reports usage only.
    ruleCounts: { 'display:block': 0, 'fg-red-60': 0 },
    prerendered: true,
    manifestLoads: 0,
    color: expect.not.stringMatching(/^rgb\(0, 0, 0\)$/),
    display: 'block'
  })
  expect(engineRequests(requests)).toEqual([])
})

test('keeps the engine deferred when a page script adds a mode class from manifest selectors', async ({ page }) => {
  const manifest: MasterCSSManifest = {
    ...defaultManifest,
    mixins: [...(defaultManifest.mixins || []), {
      name: '--dark',
      body: [{ type: 'rule', selector: '&:where(.dark, .dark *)', body: [{ type: 'contents', fallback: [] }] }]
    }]
  }
  const { loaderURL, requests } = await openPrerenderedPage(page, '<p class="fg-red-60"></p>', ['fg-red-60'], undefined, manifest)
  await startDeferredRuntime(page, loaderURL, { manifest })
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await waitForFrames(page)
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().engine)).toBe('deferred')
  expect(engineRequests(requests)).toEqual([])
})

test('keeps the engine deferred when a page script toggles a state class from rendered rules', async ({ page }) => {
  const { loaderURL, requests } = await openPrerenderedPage(page, '<p id="target" class="fg-red-60.active"></p>', ['fg-red-60.active'])
  await startDeferredRuntime(page, loaderURL)
  const before = await page.evaluate(() => getComputedStyle(document.getElementById('target')!).color)
  await page.evaluate(() => document.getElementById('target')!.classList.add('active'))
  await waitForFrames(page)
  expect(await page.evaluate(() => ({
    engine: globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().engine,
    styled: getComputedStyle(document.getElementById('target')!).color
  }))).toEqual({ engine: 'deferred', styled: expect.not.stringMatching(new RegExp(`^${before.replace(/[()]/g, '\\$&')}$`)) })
  expect(engineRequests(requests)).toEqual([])
})

test('starts the engine once for the first class pre-rendered CSS lacks', async ({ page }) => {
  const { loaderURL, requests } = await openPrerenderedPage(page, '<p id="target" class="fg-red-60"></p>', ['fg-red-60'])
  await startDeferredRuntime(page, loaderURL)
  await page.evaluate(() => {
    document.getElementById('target')!.classList.add('display:flex')
    const other = document.createElement('p')
    other.className = 'fg-blue-60'
    document.body.append(other)
  })
  await waitForEngine(page, 'ready')

  expect(await page.evaluate(() => {
    const snapshot = globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot()
    return {
      binding: snapshot.binding,
      hydration: snapshot.hydration.state,
      generated: ['display:flex', 'fg-blue-60', 'fg-red-60'].map(className => snapshot.classRules[className]?.rules.length),
      manifestLoads: globalThis.__MASTER_CSS_RUNTIME_MANIFEST_LOADS__,
      display: getComputedStyle(document.getElementById('target')!).display
    }
  })).toEqual({
    binding: 'wasm',
    hydration: 'progressive',
    generated: [1, 1, 1],
    manifestLoads: 1,
    display: 'flex'
  })
  expect(requests.filter(url => wasmRequest.test(url))).toHaveLength(1)
})

test('retains classes removed while deferred once the engine starts', async ({ page }) => {
  const { loaderURL } = await openPrerenderedPage(page, '<p id="target" class="fg-red-60"></p>', ['fg-red-60'])
  await startDeferredRuntime(page, loaderURL)
  await page.evaluate(() => document.getElementById('target')!.classList.remove('fg-red-60'))
  await waitForFrames(page)
  expect(await page.evaluate(() => {
    const snapshot = globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot()
    return { engine: snapshot.engine, usageCounts: snapshot.usageCounts, prerendered: snapshot.cssText.includes('.fg-red-60') }
  })).toEqual({ engine: 'deferred', usageCounts: {}, prerendered: true })

  await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.ready())
  await waitForFrames(page)
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().classRules['fg-red-60']?.retained)).toBe(true)
  expect(await page.evaluate(() => ({
    removedCount: globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules(),
    text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
  }))).toEqual({ removedCount: 1, text: '' })
})

test('detects a hydration mismatch when the deferred engine starts', async ({ page }) => {
  const warnings: string[] = []
  page.on('console', message => {
    if (message.type() === 'warning') warnings.push(message.text())
  })
  const { loaderURL } = await openPrerenderedPage(
    page,
    '<p id="target" class="fg-red-60"></p>',
    ['fg-red-60'],
    cssText => cssText.replace('.fg-red-60{', '.fg-red-60{outline:1px solid;')
  )
  await startDeferredRuntime(page, loaderURL)
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().engine)).toBe('deferred')

  await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.ready())
  expect(await page.evaluate(() => {
    const snapshot = globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot()
    return {
      hydration: snapshot.hydration.state,
      failed: Boolean(snapshot.hydration.failureReason),
      rebuilt: snapshot.cssText.includes('.fg-red-60') && !snapshot.cssText.includes('outline')
    }
  })).toEqual({ hydration: 'runtime', failed: true, rebuilt: true })
  expect(warnings.some(warning => warning.includes('progressive hydration'))).toBe(true)
})

test('keeps pre-rendered CSS and waits for a retry when the deferred engine fails', async ({ page }) => {
  await page.route(wasmRequest, route => route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' }))
  const { loaderURL, requests } = await openPrerenderedPage(page, '<p id="target" class="fg-red-60"></p>', ['fg-red-60'])
  await startDeferredRuntime(page, loaderURL)
  await page.evaluate(() => document.getElementById('target')!.classList.add('display:flex'))
  await waitForEngine(page, 'failed')

  expect(await page.evaluate(async () => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    const readyError = await runtime.ready().then(() => undefined, (error: { code?: string }) => error.code)
    const other = document.createElement('p')
    other.className = 'fg-blue-60'
    document.body.append(other)
    await new Promise(resolve => setTimeout(resolve, 50))
    return {
      readyError,
      diagnostics: globalThis.__MASTER_CSS_RUNTIME_DIAGNOSTICS__.map(diagnostic => diagnostic.severity),
      engine: runtime.snapshot().engine,
      prerendered: runtime.snapshot().cssText.includes('.fg-red-60'),
      color: getComputedStyle(document.getElementById('target')!).color
    }
  })).toEqual({
    readyError: 'WASM_LOAD_FAILED',
    diagnostics: ['error'],
    engine: 'failed',
    prerendered: true,
    color: expect.not.stringMatching(/^rgb\(0, 0, 0\)$/)
  })
  expect(requests.filter(url => wasmRequest.test(url))).toHaveLength(1)

  await page.unroute(wasmRequest)
  await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.refresh())
  await waitForEngine(page, 'ready')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().classRules['fg-blue-60']?.rules.length)).toBe(1)
})

test('rejects rule changes before the engine is ready and starts it', async ({ page }) => {
  const { loaderURL } = await openPrerenderedPage(page, '<p class="fg-red-60"></p>', ['fg-red-60'])
  await startDeferredRuntime(page, loaderURL)

  expect(await page.evaluate(async () => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    let code: string | undefined
    try {
      runtime.ensureClassRules(['fg-blue-60'])
    } catch (error) {
      code = (error as { code?: string }).code
    }
    const engineAfterRejection = runtime.snapshot().engine
    await runtime.ready()
    const transition = runtime.ensureClassRules(['fg-blue-60'])
    return { code, engineAfterRejection, inserted: transition.mutations.length > 0 }
  })).toEqual({ code: 'RUNTIME_ENGINE_NOT_READY', engineAfterRejection: 'loading', inserted: true })
})

test('starts a deferred engine from refreshed inputs without the original manifest loader', async ({ page }) => {
  const { loaderURL } = await openPrerenderedPage(page, '<p class="fg-red-60"></p>', ['fg-red-60'])
  await startDeferredRuntime(page, loaderURL)

  expect(await page.evaluate(async (manifest) => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    runtime.refresh(manifest)
    await runtime.ready()
    const snapshot = runtime.snapshot()
    return {
      engine: snapshot.engine,
      hydration: snapshot.hydration.state,
      manifestLoads: globalThis.__MASTER_CSS_RUNTIME_MANIFEST_LOADS__
    }
  }, defaultManifest)).toEqual({ engine: 'ready', hydration: 'progressive', manifestLoads: 0 })
})

test('disposes an engine that finishes loading after the runtime is disposed', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route(wasmRequest, async (route) => {
    await new Promise(resolve => setTimeout(resolve, 150))
    await route.continue()
  })
  const { loaderURL } = await openPrerenderedPage(page, '<p class="fg-red-60"></p>', ['fg-red-60'])
  await startDeferredRuntime(page, loaderURL)

  expect(await page.evaluate(async () => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    const ready = runtime.ready().then(() => undefined, (error: { code?: string }) => error.code)
    runtime.dispose()
    return { readyError: await ready, global: globalThis.masterCSSRuntime ?? null }
  })).toEqual({ readyError: 'RUNTIME_DISPOSED', global: null })
  await page.waitForTimeout(300)
  expect(errors).toEqual([])
})

test('starts a deferred engine while idle when prefetching is enabled', async ({ page }) => {
  const { loaderURL } = await openPrerenderedPage(page, '<p class="fg-red-60"></p>', ['fg-red-60'])
  await startDeferredRuntime(page, loaderURL, { enginePrefetch: 'idle' })
  await waitForEngine(page, 'ready')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration.state)).toBe('progressive')
})

test('loads the engine at start when eager startup is requested', async ({ page }) => {
  const { loaderURL } = await openPrerenderedPage(page, '<p class="fg-red-60"></p>', ['fg-red-60'])
  await startDeferredRuntime(page, loaderURL, { engine: 'eager' })
  expect(await page.evaluate(() => ({
    engine: globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().engine,
    manifestLoads: globalThis.__MASTER_CSS_RUNTIME_MANIFEST_LOADS__
  }))).toEqual({ engine: 'ready', manifestLoads: 1 })
})
