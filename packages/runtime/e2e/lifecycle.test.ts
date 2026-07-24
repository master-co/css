import { test, expect, type Page } from '@playwright/test'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { UtilityType } from '@master/css-schema/utility-type'
import init from './init'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

async function waitForRuntimeRuleFlush(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  }))
}

test('starts the browser runtime through the Wasm binding', async ({ page }) => {
  await init(page)
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.binding)).toBe('wasm')
})

test('exposes only the frozen runtime facade and immutable snapshot', async ({ page }) => {
  await init(page)
  await expect(page.evaluate(() => ({
    frozen: Object.isFrozen(globalThis.masterCSSRuntime),
    snapshotFrozen: Object.isFrozen(globalThis.masterCSSRuntime.snapshot()),
    inspectClass: 'inspectClass' in globalThis.masterCSSRuntime,
    normalizeNumericValue: 'normalizeNumericValue' in globalThis.masterCSSRuntime,
    classCounts: 'classCounts' in globalThis.masterCSSRuntime,
    classUtilities: 'classUtilities' in globalThis.masterCSSRuntime,
    retainedClassNames: 'retainedClassNames' in globalThis.masterCSSRuntime
  }))).resolves.toEqual({
    frozen: true,
    snapshotFrozen: true,
    inspectClass: false,
    normalizeNumericValue: false,
    classCounts: false,
    classUtilities: false,
    retainedClassNames: false
  })
})

test('does not install the removed devtools hook global', async ({ page }) => {
  await init(page)
  await expect(page.evaluate(() => ['__MASTER', 'CSS', 'DEVTOOLS', 'HOOK__'].join('_') in globalThis)).resolves.toBe(false)
})

test('dispose on progressive', async ({ page }) => {
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
    const nextRuntime = await globalThis.MasterCSSRuntime.start({ manifest })
    nextRuntime.observe()
    document.body.classList.add('block')
    document.body.classList.add('font:bold')
  }, defaultManifest)
  await waitForRuntimeRuleFlush(page)
  expect(await page.evaluate(() => {
    const classRules = globalThis.masterCSSRuntime?.snapshot().classRules
    return Object.fromEntries(Object.entries(classRules || {})
      .map(([className, snapshot]) => [className, snapshot.rules.length]))
  })).toMatchObject({
    block: 1,
    'font:bold': 1
  })
})

test('prevent attach layer twice', async ({ page }) => {
  await init(page, '@layer components{}', {
    utilities: [
      {
        name: 'app-wrapper',
        type: UtilityType.Semantic,
        layer: 'components',
        rules: [
          { selector: '&', declarations: { 'margin-left': 'auto', 'margin-right': 'auto' } },
          { selector: '&', declarations: { 'padding-left': '1.25rem', 'padding-right': '1.25rem' } },
          { selector: '&', declarations: { height: '2.5rem' } }
        ]
      }
    ]
  })
  await page.evaluate(() => {
    document.body.classList.add('app-wrapper')
  })
  await waitForRuntimeRuleFlush(page)
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.componentsLayer.native?.cssRules?.length)).toBe(3)
})

test('insert semantic utility with multiple native rules into existing layer', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await page.evaluate(() => {
    document.body.innerHTML = '<div class="block multi-rule"></div>'
  })
  await init(page, '', {
    utilities: [
      {
        name: 'multi-rule',
        rules: [
          { selector: '&', declarations: { display: 'flex' } },
          { selector: '&:hover', declarations: { color: 'red' } },
          { selector: '&', conditions: ['@supports (appearance:none)'], declarations: { 'scrollbar-width': 'thin' } }
        ]
      }
    ]
  })
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.native?.cssRules.length)).toBe(4)
  expect(consoleErrors.find((message) => message.includes('insertRule'))).toBeUndefined()
})

test('inserts functional pseudo-class selector aliases into native CSSOM', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await page.evaluate(() => {
    document.body.innerHTML = '<div class="pb:8x:not(:last) text-center_td:not(:first)"></div>'
  })
  await init(page)

  expect(await page.evaluate(() => Array.from(globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.native?.cssRules || [])
    .map((cssRule) => cssRule.cssText)
  )).toEqual([
    '.text-center_td\\:not\\(\\:first\\) td:not(:first-child) { text-align: center; }',
    '.pb\\:8x\\:not\\(\\:last\\):not(:last-child) { padding-bottom: 2rem; }'
  ])
  expect(consoleErrors.find((message) => message.includes('insertRule'))).toBeUndefined()
})

test('refresh clears stale native keyframes', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.body.classList.add('animation:fade|1s', 'animation:flash|1s')
  })
  await waitForRuntimeRuleFlush(page)
  expect(await page.evaluate(() => Array.from(globalThis.__MASTER_CSS_RUNTIME_TEST__.style!.sheet!.cssRules)
    .filter((cssRule) => cssRule.constructor.name === 'CSSKeyframesRule')
    .map((cssRule) => (cssRule as CSSKeyframesRule).name)
  )).toEqual(['fade', 'flash'])

  await page.evaluate(() => {
    globalThis.__MASTER_CSS_RUNTIME_TEST__.refresh()
  })
  expect(await page.evaluate(() => Array.from(globalThis.__MASTER_CSS_RUNTIME_TEST__.style!.sheet!.cssRules)
    .filter((cssRule) => cssRule.constructor.name === 'CSSKeyframesRule')
    .map((cssRule) => (cssRule as CSSKeyframesRule).name)
  )).toEqual(['fade', 'flash'])
})

test('observes static theme variables and keyframes without class references', async ({ page }) => {
  await init(page, undefined, {
    variables: [
      {
        name: 'color-static',
        key: 'static',
        namespace: 'color',
        type: 'string',
        value: '#123',
        static: true
      }
    ],
    animations: {
      'static-fade': {
        to: {
          opacity: '1'
        }
      }
    },
    animationOptions: {
      'static-fade': {
        static: true
      }
    }
  })

  const cssRules = await page.evaluate(() => Array.from(globalThis.__MASTER_CSS_RUNTIME_TEST__.style!.sheet!.cssRules)
    .map((cssRule) => cssRule.cssText)
  )
  expect(cssRules.some((cssRule) => cssRule.includes('--color-static'))).toBe(true)
  expect(cssRules.some((cssRule) => cssRule.includes('@keyframes static-fade'))).toBe(true)
})

test('generates browser native declarations through CSS.supports fallback', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = [
      '<div class="float:left display:block field-sizing:content transition-behavior:allow-discrete color:oklch(63.7%|0.237|25.331)"></div>',
      '<div class="made-up:left float:banana display:banana"></div>'
    ].join('')
  })
  await init(page)

  const result = await page.evaluate(() => ({
    supports: {
      fieldSizing: CSS.supports('field-sizing', 'content'),
      transitionBehavior: CSS.supports('transition-behavior', 'allow-discrete')
    },
    classUtilities: Object.entries(globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().classRules)
      .filter(([, { rules }]) => rules.length)
      .map(([className]) => className),
    rustText: globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().cssText,
    cssRules: Array.from(globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.native?.cssRules || [])
      .map((cssRule) => cssRule.cssText)
  }))

  expect(result.classUtilities).toContain('float:left')
  expect(result.classUtilities).toContain('display:block')
  expect(result.classUtilities).toContain('color:oklch(63.7%|0.237|25.331)')
  expect(result.cssRules.some((cssRule) => cssRule.includes('float: left'))).toBe(true)
  expect(result.cssRules.some((cssRule) => cssRule.includes('display: block'))).toBe(true)
  expect(result.cssRules.some((cssRule) => cssRule.includes('oklch'))).toBe(true)
  expect(result.rustText).toContain('.float\\:left{float:left}')
  expect(result.rustText).toContain('.display\\:block{display:block}')
  expect(result.rustText).not.toContain('made-up')
  expect(result.rustText).not.toContain('banana')

  if (result.supports.fieldSizing) {
    expect(result.classUtilities).toContain('field-sizing:content')
    expect(result.cssRules.some((cssRule) => cssRule.includes('field-sizing: content'))).toBe(true)
  }
  if (result.supports.transitionBehavior) {
    expect(result.classUtilities).toContain('transition-behavior:allow-discrete')
    expect(result.cssRules.some((cssRule) => cssRule.includes('transition-behavior: allow-discrete'))).toBe(true)
  }

  expect(result.classUtilities).not.toContain('made-up:left')
  expect(result.classUtilities).not.toContain('float:banana')
  expect(result.classUtilities).not.toContain('display:banana')
})

test('hydrates progressive static theme variables and keyframes', async ({ page }) => {
  await page.evaluate(() => {
    document.body.innerHTML = '<div class="block"></div>'
  })
  await init(page, [
    '@layer theme{:root{--color-static:#123}}',
    '@layer utilities{.block{display:block}}',
    '@keyframes static-fade{to{opacity:1}}'
  ].join(''), {
    variables: [
      {
        name: 'color-static',
        key: 'static',
        namespace: 'color',
        type: 'string',
        value: '#123',
        static: true
      }
    ],
    animations: {
      'static-fade': {
        to: {
          opacity: '1'
        }
      }
    },
    animationOptions: {
      'static-fade': {
        static: true
      }
    }
  }, 'auto')

  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.progressive)).toBe(true)
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.themeLayer.rules.map((rule) => rule.name))).toEqual(['color-static'])
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.animationsNonLayer.rules.map((rule) => rule.name))).toEqual(['static-fade'])
})

test('registers emittedGlobals counts on an existing runtime', async ({ page }) => {
  await init(page)
  const result = await page.evaluate(async (manifest) => {
    const current = globalThis.__MASTER_CSS_RUNTIME_TEST__
    const returned = await globalThis.MasterCSSRuntime.start({
      manifest,
      emittedGlobals: {
        variables: { 'color-primary': 1 },
        animations: { fade: 1 }
      }
    })
    const returnedAgain = await globalThis.MasterCSSRuntime.start({ manifest })
    return {
      same: returned === returnedAgain,
      variables: current.emittedGlobals.variables,
      animations: current.emittedGlobals.animations,
      variableCounts: Object.fromEntries(current.themeLayer.tokenCounts),
      animationCounts: Object.fromEntries(current.animationsNonLayer.tokenCounts)
    }
  }, defaultManifest)

  expect(result.same).toBe(true)
  expect(result.variables).toMatchObject({ 'color-primary': 1 })
  expect(result.animations).toMatchObject({ fade: 1 })
  expect(result.variableCounts).toMatchObject({ 'color-primary': 1 })
  expect(result.animationCounts).toMatchObject({ fade: 1 })
})

test('registers emittedGlobals counts once on a new runtime', async ({ page }) => {
  await init(page)
  const result = await page.evaluate(async (manifest) => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = host.attachShadow({ mode: 'open' })
    const runtime = await globalThis.MasterCSSRuntime.start({
      manifest,
      root,
      emittedGlobals: {
        variables: { 'color-primary': 1 },
        animations: { fade: 1 }
      }
    })
    const result = {
      variables: runtime.emittedGlobals.variables,
      animations: runtime.emittedGlobals.animations,
      variableCounts: Object.fromEntries(runtime.themeLayer.tokenCounts),
      animationCounts: Object.fromEntries(runtime.animationsNonLayer.tokenCounts)
    }
    runtime.dispose()
    return result
  }, defaultManifest)

  expect(result.variables).toMatchObject({ 'color-primary': 1 })
  expect(result.animations).toMatchObject({ fade: 1 })
  expect(result.variableCounts).toMatchObject({ 'color-primary': 1 })
  expect(result.animationCounts).toMatchObject({ fade: 1 })
})
