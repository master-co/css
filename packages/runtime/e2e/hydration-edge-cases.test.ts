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

test('progressive hydration fetches an external manifest when import attributes are unsupported', async ({ page }) => {
  const { text, hydrationManifest } = renderHydration('fg:red-60')
  const loaderURL = await getRuntimeLoaderURL()
  const source = new URL('/_master-css/hydration/syntax-fallback.json', loaderURL).href

  await gotoRuntimeOrigin(page, loaderURL)
  await page.route(source, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
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

  const result = await page.evaluate(async ({ loaderURL, source }) => {
    const { startCSSRuntimeAsync } = await import(loaderURL)
    const NativeFunction = globalThis.Function
    const nativeFetch = globalThis.fetch
    let fetchCalls = 0
    globalThis.Function = function (...args: string[]) {
      if (args.at(-1)?.includes(`with: { type: 'json' }`)) {
        throw new SyntaxError('Unsupported import attributes')
      }
      return NativeFunction(...args)
    } as FunctionConstructor
    globalThis.fetch = async (...args) => {
      const requestURL = typeof args[0] === 'string'
        ? args[0]
        : args[0] instanceof URL ? args[0].href : args[0].url
      if (requestURL === source) fetchCalls++
      return nativeFetch(...args)
    }
    try {
      await startCSSRuntimeAsync()
      return {
        fetchCalls,
        progressive: globalThis.__MASTER_CSS_RUNTIME_TEST__.progressive,
        text: globalThis.__MASTER_CSS_RUNTIME_TEST__.text
      }
    } finally {
      globalThis.Function = NativeFunction
      globalThis.fetch = nativeFetch
    }
  }, { loaderURL, source })

  expect(result).toEqual({
    fetchCalls: 1,
    progressive: true,
    text
  })
})

test('external hydration does not fetch for non-syntax loader construction failures', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  const source = new URL('/_master-css/hydration/eval-error.json', loaderURL).href

  await gotoRuntimeOrigin(page, loaderURL)
  await page.evaluate(({ attr, runtimeStyleId, source }) => {
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

  const result = await page.evaluate(async ({ loaderURL, source }) => {
    const { startCSSRuntimeAsync } = await import(loaderURL)
    const NativeFunction = globalThis.Function
    const nativeFetch = globalThis.fetch
    let fetchCalls = 0
    globalThis.Function = function (...args: string[]) {
      if (args.at(-1)?.includes(`with: { type: 'json' }`)) throw new EvalError('Blocked by policy')
      return NativeFunction(...args)
    } as FunctionConstructor
    globalThis.fetch = async (...args) => {
      const requestURL = typeof args[0] === 'string'
        ? args[0]
        : args[0] instanceof URL ? args[0].href : args[0].url
      if (requestURL === source) fetchCalls++
      return nativeFetch(...args)
    }
    try {
      await startCSSRuntimeAsync()
    } catch (error) {
      return {
        code: (error as { code?: string }).code,
        fetchCalls,
        runtimeStarted: Boolean(globalThis.__MASTER_CSS_RUNTIME_TEST__)
      }
    } finally {
      globalThis.Function = NativeFunction
      globalThis.fetch = nativeFetch
    }
    throw new Error('Expected runtime startup to fail.')
  }, { loaderURL, source })

  expect(result).toEqual({
    code: 'INVALID_HYDRATION_MANIFEST',
    fetchCalls: 0,
    runtimeStarted: false
  })
})

test('external hydration does not fetch after a JSON import request fails', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  const source = new URL('/_master-css/hydration/import-failure.json', loaderURL).href

  await gotoRuntimeOrigin(page, loaderURL)
  await page.route(source, route => route.fulfill({ status: 404, body: 'not found' }))
  await page.evaluate(({ attr, runtimeStyleId, source }) => {
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

  const result = await page.evaluate(async ({ loaderURL, source }) => {
    const { startCSSRuntimeAsync } = await import(loaderURL)
    const nativeFetch = globalThis.fetch
    let fetchCalls = 0
    globalThis.fetch = async (...args) => {
      const requestURL = typeof args[0] === 'string'
        ? args[0]
        : args[0] instanceof URL ? args[0].href : args[0].url
      if (requestURL === source) fetchCalls++
      return nativeFetch(...args)
    }
    try {
      await startCSSRuntimeAsync()
    } catch (error) {
      return { code: (error as { code?: string }).code, fetchCalls }
    } finally {
      globalThis.fetch = nativeFetch
    }
    throw new Error('Expected runtime startup to fail.')
  }, { loaderURL, source })

  expect(result).toEqual({
    code: 'INVALID_HYDRATION_MANIFEST',
    fetchCalls: 0
  })
})

test('external hydration reports fallback HTTP failures as structured diagnostics', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  const source = new URL('/_master-css/hydration/fallback-failure.json', loaderURL).href

  await gotoRuntimeOrigin(page, loaderURL)
  await page.route(source, route => route.fulfill({ status: 503, body: 'unavailable' }))
  await page.evaluate(({ attr, runtimeStyleId, source }) => {
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

  const result = await page.evaluate(async (loaderURL) => {
    const { startCSSRuntimeAsync } = await import(loaderURL)
    const NativeFunction = globalThis.Function
    globalThis.Function = function (...args: string[]) {
      if (args.at(-1)?.includes(`with: { type: 'json' }`)) {
        throw new SyntaxError('Unsupported import attributes')
      }
      return NativeFunction(...args)
    } as FunctionConstructor
    try {
      await startCSSRuntimeAsync()
    } catch (error) {
      return {
        code: (error as { code?: string }).code,
        cause: (error as { cause?: Error }).cause?.message
      }
    } finally {
      globalThis.Function = NativeFunction
    }
    throw new Error('Expected runtime startup to fail.')
  }, loaderURL)

  expect(result).toEqual({
    code: 'INVALID_HYDRATION_MANIFEST',
    cause: `Cannot load the Master CSS hydration manifest from ${source} (HTTP 503).`
  })
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
