import { expect, test, type Page } from '@playwright/test'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MASTER_CSS_HYDRATION_MANIFEST_ATTR } from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import init, { getRuntimeLoaderURL } from './init'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

async function waitForRuntimeRuleFlush(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  }))
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

async function gotoRuntimeOrigin(page: Page, loaderURL: string) {
  const blankURL = new URL('/__master-css-runtime-rc87.html', loaderURL).href
  await page.route(blankURL, route => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><html><head></head><body></body></html>'
  }))
  await page.goto(blankURL)
}

test('does not expose tooling-only engine inspection helpers', async ({ page }) => {
  await init(page)
  await expect(page.evaluate(() => ({
    inspectClass: 'inspectClass' in globalThis.masterCSSRuntime,
    normalizeNumericValue: 'normalizeNumericValue' in globalThis.masterCSSRuntime
  }))).resolves.toEqual({
    inspectClass: false,
    normalizeNumericValue: false
  })
})

test('destroy on progressive', async ({ page }) => {
  await init(page, '@layer utilities{}')
  await page.evaluate(() => {
    document.body.classList.add('text-center')
  })
  await waitForRuntimeRuleFlush(page)
  expect(await page.evaluate(() =>
    globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().layers
      .find(({ name }) => name === 'utilities')?.ruleCount
  )).toBe(1)

  await page.evaluate(() => {
    globalThis.__MASTER_CSS_RUNTIME_TEST__.dispose()
  })
  expect(await page.evaluate(() => ({
    globalCleared: globalThis.masterCSSRuntime === undefined,
    styleRemoved: !document.getElementById('master-css')
  }))).toEqual({
    globalCleared: true,
    styleRemoved: true
  })

  await page.evaluate(async (manifest) => {
    const runtime = await globalThis.MasterCSSRuntime.start({ manifest })
    runtime.observe()
    document.body.classList.add('block', 'font:bold')
  }, defaultManifest)
  await waitForRuntimeRuleFlush(page)
  expect(await page.evaluate(() => globalThis.masterCSSRuntime?.snapshot().classRules))
    .toMatchObject({
      block: expect.anything(),
      'font:bold': expect.anything()
    })
})

test('disconnect and destroy clear pending mutation additions and removals', async ({ page }) => {
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
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().classRules))
    .toEqual({})

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

test('preserves the strict Rust contract when an external hydration manifest import fails', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  const source = new URL('/_master-css/hydration/missing-rc87.json', loaderURL).href

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
  const result = await page.evaluate(async (loaderURL) => {
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
  }, loaderURL)

  expect(result).toEqual({
    code: 'INVALID_HYDRATION_MANIFEST',
    runtimeStarted: false
  })
})
