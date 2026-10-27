import { expect, test, type Page } from '@playwright/test'
import { compileProgram, getRuntimeLoaderURL } from './init'

async function gotoRuntimeOrigin(page: Page, loaderURL: string) {
  const blankURL = new URL('/__master-css-runtime-engine-startup.html', loaderURL).href
  await page.route(blankURL, route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html hidden><head></head><body><p class="display:block"></p></body></html>'
  }))
  await page.goto(blankURL, { waitUntil: 'domcontentloaded' })
}

test('executes the program with the JavaScript engine without fetching Wasm', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  const wasmRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('.wasm')) wasmRequests.push(request.url())
  })
  await gotoRuntimeOrigin(page, loaderURL)

  const result = await page.evaluate(async ({ loaderURL }) => {
    const { startCSSRuntimeAsync } = await import(loaderURL)
    const runtime = await startCSSRuntimeAsync()
    return {
      binding: runtime.binding,
      hidden: document.documentElement.hasAttribute('hidden'),
      text: runtime.snapshot().cssText
    }
  }, { loaderURL })

  expect(wasmRequests).toEqual([])
  expect(result).toEqual({
    binding: 'js',
    hidden: false,
    text: "@layer utilities{.display\\:block{display:block}}"
  })
})

test('fails open with the engine diagnostic for an invalid program', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  await gotoRuntimeOrigin(page, loaderURL)

  expect(await page.evaluate(async ({ loaderURL }) => {
    await import(loaderURL)
    const diagnostics: { code: string, domain: string }[] = []
    try {
      await globalThis.MasterCSSRuntime.start({
        program: new Uint8Array([1, 2, 3]),
        onDiagnostic: ({ code, domain }) => diagnostics.push({ code, domain })
      })
    } catch (error) {
      return {
        code: (error as { code?: string }).code,
        diagnostics,
        hidden: document.documentElement.hasAttribute('hidden')
      }
    }
    throw new Error('Expected runtime startup to fail.')
  }, { loaderURL })).toEqual({
    code: 'INVALID_PROGRAM',
    diagnostics: [{ code: 'INVALID_PROGRAM', domain: 'engine' }],
    hidden: false
  })
})

test('fails open when engine startup exceeds the configured timeout', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  await gotoRuntimeOrigin(page, loaderURL)

  expect(await page.evaluate(async ({ loaderURL, program }) => {
    await import(loaderURL)
    try {
      await globalThis.MasterCSSRuntime.start({
        program: async () => {
          await new Promise(resolve => setTimeout(resolve, 150))
          return program
        },
        startupTimeoutMs: 25
      })
    } catch (error) {
      return {
        code: (error as { code?: string }).code,
        hidden: document.documentElement.hasAttribute('hidden')
      }
    }
    throw new Error('Expected runtime startup to fail.')
  }, { loaderURL, program: compileProgram() })).toEqual({
    code: 'RUNTIME_STARTUP_TIMEOUT',
    hidden: false
  })
  await page.waitForTimeout(175)
  expect(await page.evaluate(() => globalThis.masterCSSRuntime)).toBeUndefined()
})

test('disposes an eager engine that resolves before hydration startup times out', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  const hydrationURL = new URL('/slow-hydration.json', loaderURL).href
  await page.route(hydrationURL, async route => {
    await new Promise(resolve => setTimeout(resolve, 150))
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ version: 2, rules: [], resourceOrder: [] })
    })
  })
  await gotoRuntimeOrigin(page, loaderURL)

  const result = await page.evaluate(async ({ hydrationURL, loaderURL, program }) => {
    await import(loaderURL)
    const style = document.createElement('style')
    style.id = 'master-css'
    style.setAttribute('data-master-css-hydration-manifest', hydrationURL)
    document.head.append(style)
    let disposals = 0
    const engine = {
      binding: 'js' as const,
      ensureClassRules: () => ({ version: 3, mutations: [] }),
      deleteClassRules: () => ({ version: 3, mutations: [] }),
      registerEmittedGlobals: () => ({ version: 3, mutations: [] }),
      refresh: () => ({ version: 3, mutations: [] }),
      keyframeDefinitions: () => [],
      inspect: (className: string) => ({ version: 2, className, valid: false, rules: [] }),
      snapshot: () => ({
        version: 3,
        rules: [],
        resources: { variables: [], keyframes: [] },
        text: ''
      }),
      dispose: () => { disposals++ },
      [Symbol.dispose]: () => { disposals++ }
    }
    const binding = {
      kind: 'js' as const,
      createEngine: async () => engine
    }
    let code: string | undefined
    try {
      await globalThis.MasterCSSRuntime.start({
        program,
        binding,
        engine: 'eager',
        startupTimeoutMs: 25
      } as never)
    } catch (error) {
      code = (error as { code?: string }).code
    }
    style.remove()
    const retry = await globalThis.MasterCSSRuntime.start({ program })
    const retryBinding = retry.binding
    retry.dispose()
    return { code, disposals, retryBinding }
  }, { hydrationURL, loaderURL, program: compileProgram() })

  expect(result).toEqual({
    code: 'RUNTIME_STARTUP_TIMEOUT',
    disposals: 1,
    retryBinding: 'js'
  })
})

test('rejects every pending caller and disposes when emitted globals registration fails', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  await gotoRuntimeOrigin(page, loaderURL)

  const result = await page.evaluate(async ({ loaderURL, program }) => {
    await import(loaderURL)
    let disposals = 0
    const engine = {
      binding: 'js' as const,
      ensureClassRules: () => ({ version: 3, mutations: [] }),
      deleteClassRules: () => ({ version: 3, mutations: [] }),
      registerEmittedGlobals: () => {
        throw new Error('invalid emitted globals')
      },
      refresh: () => ({ version: 3, mutations: [] }),
      keyframeDefinitions: () => [],
      inspect: (className: string) => ({ version: 2, className, valid: false, rules: [] }),
      snapshot: () => ({
        version: 3,
        rules: [],
        resources: { variables: [], keyframes: [] },
        text: ''
      }),
      dispose: () => { disposals++ },
      [Symbol.dispose]: () => { disposals++ }
    }
    const binding = {
      kind: 'js' as const,
      createEngine: async () => {
        await new Promise(resolve => setTimeout(resolve, 25))
        return engine
      }
    }
    const first = globalThis.MasterCSSRuntime.start({ program, binding } as never)
    const second = globalThis.MasterCSSRuntime.start({
      program,
      emittedGlobals: { variables: { invalid: 1 } }
    })
    const failures = await Promise.allSettled([first, second])
    const retry = await globalThis.MasterCSSRuntime.start({ program })
    const retryBinding = retry.binding
    retry.dispose()
    return {
      disposals,
      failures: failures.map(settled => ({
        status: settled.status,
        message: settled.status === 'rejected' ? String(settled.reason) : undefined
      })),
      retryBinding
    }
  }, { loaderURL, program: compileProgram() })

  expect(result).toEqual({
    disposals: 1,
    failures: [
      { status: 'rejected', message: 'Error: invalid emitted globals' },
      { status: 'rejected', message: 'Error: invalid emitted globals' }
    ],
    retryBinding: 'js'
  })
})
