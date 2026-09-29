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
    document.body.classList.add("text-align:center")
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
    document.body.classList.add("display:block")
    document.body.classList.add('font-weight-bold')
  }, defaultManifest)
  await waitForRuntimeRuleFlush(page)
  expect(await page.evaluate(() => {
    const classRules = globalThis.masterCSSRuntime?.snapshot().classRules
    return Object.fromEntries(Object.entries(classRules || {})
      .map(([className, snapshot]) => [className, snapshot.rules.length]))
  })).toMatchObject({
    'display:block': 1,
    'font-weight-bold': 1
  })
})

test('prevent attach layer twice', async ({ page }) => {
  await init(page, '@layer components{}', {
    mixins: [
  {
    "name": "--app-wrapper",
    "body": [
      {
        "type": "rule" as const,
        "selector": "&",
        "body": [
          {
            "type": "declaration" as const,
            "property": "margin-left",
            "value": [
              {
                "type": "text" as const,
                "value": "auto"
              }
            ]
          },
          {
            "type": "declaration" as const,
            "property": "margin-right",
            "value": [
              {
                "type": "text" as const,
                "value": "auto"
              }
            ]
          }
        ]
      },
      {
        "type": "rule" as const,
        "selector": "&:hover",
        "body": [
          {
            "type": "declaration" as const,
            "property": "padding-left",
            "value": [
              {
                "type": "text" as const,
                "value": "1.25rem"
              }
            ]
          },
          {
            "type": "declaration" as const,
            "property": "padding-right",
            "value": [
              {
                "type": "text" as const,
                "value": "1.25rem"
              }
            ]
          }
        ]
      },
      {
        "type": "rule" as const,
        "selector": "&:focus",
        "body": [
          {
            "type": "declaration" as const,
            "property": "height",
            "value": [
              {
                "type": "text" as const,
                "value": "2.5rem"
              }
            ]
          }
        ]
      }
    ]
  }
]
  })
  await page.evaluate(() => {
    document.body.classList.add('app-wrapper@layer(components)')
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
    document.body.innerHTML = "<div class=\"display:block multi-rule\"></div>"
  })
  await init(page, '', {
    mixins: [
  {
    "name": "--multi-rule",
    "body": [
      {
        "type": "rule" as const,
        "selector": "&",
        "body": [
          {
            "type": "declaration" as const,
            "property": "display",
            "value": [
              {
                "type": "text" as const,
                "value": "flex"
              }
            ]
          }
        ]
      },
      {
        "type": "rule" as const,
        "selector": "&:hover",
        "body": [
          {
            "type": "declaration" as const,
            "property": "color",
            "value": [
              {
                "type": "text" as const,
                "value": "red"
              }
            ]
          }
        ]
      },
      {
        "type": "condition" as const,
        "condition": "@supports (appearance:none)",
        "body": [
          {
            "type": "rule" as const,
            "selector": "&",
            "body": [
              {
                "type": "declaration" as const,
                "property": "scrollbar-width",
                "value": [
                  {
                    "type": "text" as const,
                    "value": "thin"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]
  })
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.native?.cssRules.length)).toBe(4)
  expect(consoleErrors.find((message) => message.includes('insertRule'))).toBeUndefined()
})

test('inserts native functional pseudo-class selectors into CSSOM', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await page.evaluate(() => {
    document.body.innerHTML = "<div class=\"padding-bottom:2rem:not(:last-child) text-align:center_td:not(:first-child)\"></div>"
  })
  await init(page)

  expect(await page.evaluate(() => Array.from(globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.native?.cssRules || [])
    .map((cssRule) => cssRule.cssText)
  )).toEqual([
    ".padding-bottom\\:2rem\\:not\\(\\:last-child\\):not(:last-child) { padding-bottom: 2rem; }",
    '.text-align\\:center_td\\:not\\(\\:first-child\\) td:not(:first-child) { text-align: center; }'
  ])
  expect(consoleErrors.find((message) => message.includes('insertRule'))).toBeUndefined()
})

test('refresh leaves native stylesheets and keyframes under browser ownership', async ({ page }) => {
  await page.setContent('<style id="native">:root{--color-static:#123}@keyframes steady{to{opacity:1}}</style><div class="animation:steady|1s"></div>')
  await init(page)
  await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.refresh())
  expect(await page.locator('#native').textContent()).toBe(':root{--color-static:#123}@keyframes steady{to{opacity:1}}')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.text)).not.toContain('@keyframes')
})

test('preserves native declarations independently of browser support', async ({ page }) => {
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
  expect(result.rustText).toContain('made-up:left')
  expect(result.rustText).toContain('display:banana')

  expect(result.classUtilities).toContain('field-sizing:content')
  expect(result.classUtilities).toContain('transition-behavior:allow-discrete')
  if (result.supports.fieldSizing) {
    expect(result.classUtilities).toContain('field-sizing:content')
    expect(result.cssRules.some((cssRule) => cssRule.includes('field-sizing: content'))).toBe(true)
  }
  if (result.supports.transitionBehavior) {
    expect(result.classUtilities).toContain('transition-behavior:allow-discrete')
    expect(result.cssRules.some((cssRule) => cssRule.includes('transition-behavior: allow-discrete'))).toBe(true)
  }

  expect(result.classUtilities).toContain('made-up:left')
  expect(result.classUtilities).toContain('float:banana')
  expect(result.classUtilities).toContain('display:banana')
})

test('progressive hydration leaves unconditional native CSS in its own stylesheet', async ({ page }) => {
  await page.setContent("<style id=\"native\">@layer theme{:root{--color-static:#123}}@keyframes steady{to{opacity:1}}</style><div class=\"display:block\"></div>")
  await init(page, "@layer utilities{.display\\:block{display:block}}", {}, 'auto')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.progressive)).toBe(true)
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.text)).not.toContain('--color-static')
  expect(await page.locator('#native').textContent()).toContain('@keyframes steady')
})

test('registers emittedGlobals counts on an existing runtime', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    document.body.innerHTML = '<div class="fg-red-60 animation:fade|1s"></div>'
  })
  await waitForRuntimeRuleFlush(page)
  const result = await page.evaluate(async (manifest) => {
    const current = globalThis.__MASTER_CSS_RUNTIME_TEST__
    const before = current.text
    const returned = await globalThis.MasterCSSRuntime.start({
      manifest,
      emittedGlobals: {
        variables: { 'color-red-60': 1 }
      }
    })
    const returnedAgain = await globalThis.MasterCSSRuntime.start({ manifest })
    return {
      same: returned === returnedAgain,
      before,
      after: current.text,
      variables: current.emittedGlobals.variables,
      variableCounts: Object.fromEntries(current.themeLayer.tokenCounts),
    }
  }, defaultManifest)

  expect(result.same).toBe(true)
  expect(result.before).toContain('--color-red-60:')
  expect(result.before).not.toContain('@keyframes fade{')
  expect(result.after).toContain('.fg-red-60')
  expect(result.after).toContain('.animation\\:fade\\|1s')
  expect(result.after).not.toContain('--color-red-60:')
  expect(result.after).not.toContain('@keyframes fade{')
  expect(result.variables).toMatchObject({ 'color-red-60': 1 })
  expect(result.variableCounts).toMatchObject({ 'color-red-60': 1 })
})

test('merges emittedGlobals from concurrent starts before resolving callers', async ({ page }) => {
  await init(page)
  const result = await page.evaluate(async (manifest) => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = host.attachShadow({ mode: 'open' })
    root.innerHTML = '<div class="fg-red-60 animation:fade|1s"></div>'
    const first = globalThis.MasterCSSRuntime.start({ manifest, root })
    const second = globalThis.MasterCSSRuntime.start({
      manifest,
      root,
      emittedGlobals: {
        variables: { 'color-red-60': 1 }
      }
    })
    const third = globalThis.MasterCSSRuntime.start({
      manifest,
      root,
      emittedGlobals: {
        variables: { 'color-red-60': 2 }
      }
    })
    const [firstRuntime, secondRuntime, thirdRuntime] = await Promise.all([first, second, third])
    firstRuntime.observe()
    const snapshot = firstRuntime.snapshot()
    const internal = firstRuntime as unknown as {
      emittedGlobals: {
        variables: Record<string, number>
      }
    }
    const emittedGlobals = structuredClone(internal.emittedGlobals)
    firstRuntime.dispose()
    return {
      same: firstRuntime === secondRuntime && secondRuntime === thirdRuntime,
      text: snapshot.cssText,
      counts: snapshot.usageCounts,
      emittedGlobals
    }
  }, defaultManifest)

  expect(result.same).toBe(true)
  expect(result.counts).toEqual({
    'animation:fade|1s': 1,
    'fg-red-60': 1
  })
  expect(result.emittedGlobals).toEqual({
    variables: { 'color-red-60': 3 }, keyframes: {}
  })
  expect(result.text).toContain('.fg-red-60')
  expect(result.text).toContain('.animation\\:fade\\|1s')
  expect(result.text).not.toContain('--color-red-60:')
  expect(result.text).toContain('@keyframes fade')
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
        variables: { 'color-primary': 1 }
      }
    })
    const result = {
      variables: runtime.emittedGlobals.variables,
      variableCounts: Object.fromEntries(runtime.themeLayer.tokenCounts),
    }
    runtime.dispose()
    return result
  }, defaultManifest)

  expect(result.variables).toMatchObject({ 'color-primary': 1 })
  expect(result.variableCounts).toMatchObject({ 'color-primary': 1 })
})
