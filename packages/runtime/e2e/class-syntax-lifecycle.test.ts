import { expect, test, type Page } from '@playwright/test'
import { createServerRenderer } from '@master/css-server'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { getRuntimeLoaderURL } from './init'

const preset = defaultManifestJSON as unknown as MasterCSSManifest

/**
 * Server-renders `body` with an injected hydration manifest, serves it from the harness origin so
 * relative URLs resolve, then starts the runtime against that page.
 */
async function hydrateServerRender(page: Page, body: string, options: Record<string, unknown> = {}) {
  using renderer = createServerRenderer({ manifest: preset })
  const rendered = renderer.renderHTML(`<!doctype html><html><head></head><body>${body}</body></html>`, { hydrationManifest: 'inject' })
  const loader = await getRuntimeLoaderURL()
  const pageURL = new URL('/__master-css-class-syntax.html', loader).href
  await page.route(pageURL, route => route.fulfill({ contentType: 'text/html', body: rendered.html }))
  await page.goto(pageURL)
  await page.evaluate(async ({ loader, options }) => {
    const { startCSSRuntime } = await import(loader)
    await startCSSRuntime(options)
  }, { loader, options })
  return rendered
}

async function waitForFrames(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  }))
}

/** Usage, engine rules and the CSSOM style rules whose selector targets `className`. */
function readClass(page: Page, className: string) {
  return page.evaluate((className) => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    const snapshot = runtime.snapshot()
    const selector = `.${CSS.escape(className)}`
    let cssomRules = 0
    const walk = (rules: CSSRuleList) => {
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule && rule.selectorText.includes(selector)) cssomRules++
        if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules)
      }
    }
    for (const sheet of document.styleSheets) walk(sheet.cssRules)
    return {
      usageCount: snapshot.usageCounts[className] ?? 0,
      rules: snapshot.classRules[className]?.rules.map(rule => rule.text) ?? [],
      retained: snapshot.classRules[className]?.retained ?? false,
      cssomRules
    }
  }, className)
}

function setClass(page: Page, id: string, className: string, force: boolean) {
  return page.evaluate(({ id, className, force }) => {
    document.getElementById(id)!.classList.toggle(className, force)
  }, { id, className, force })
}

function display(page: Page, id: string) {
  return page.locator(`#${id}`).evaluate(element => getComputedStyle(element).display)
}

const released = { usageCount: 0, rules: [], retained: false, cssomRules: 0 }

test('page scripts toggle the hidden and block short utilities on a hydrated server render', async ({ page }) => {
  // The rendered class keeps the hydration manifest non-empty; `hidden` and `block` are not rendered.
  const rendered = await hydrateServerRender(page, '<span id="first" class="fg-red-60">First</span><span id="second">Second</span>')
  expect(rendered.hydrationManifest?.classNames).toEqual(['fg-red-60'])
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration)).toEqual({ state: 'progressive', manifestLoaded: true })

  for (const [className, value] of [['hidden', 'none'], ['block', 'block']] as const) {
    const rule = `.${className}{display:${value}}`
    expect(await readClass(page, className)).toEqual(released)

    await setClass(page, 'first', className, true)
    await waitForFrames(page)
    expect(await readClass(page, className)).toEqual({ usageCount: 1, rules: [rule], retained: false, cssomRules: 1 })
    expect(await display(page, 'first')).toBe(value)

    // A second element shares the connected rule instead of inserting another one.
    await setClass(page, 'second', className, true)
    await waitForFrames(page)
    expect(await readClass(page, className)).toEqual({ usageCount: 2, rules: [rule], retained: false, cssomRules: 1 })

    await setClass(page, 'first', className, false)
    await waitForFrames(page)
    expect(await readClass(page, className)).toEqual({ usageCount: 1, rules: [rule], retained: false, cssomRules: 1 })
    expect(await display(page, 'first')).toBe('inline')
    expect(await display(page, 'second')).toBe(value)

    // The last element releases the class; its rule is retained until the cleanup boundary deletes it.
    await setClass(page, 'second', className, false)
    await waitForFrames(page)
    expect(await readClass(page, className)).toEqual({ usageCount: 0, rules: [rule], retained: true, cssomRules: 1 })
    expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules())).toBe(1)
    expect(await readClass(page, className)).toEqual(released)
    expect(await display(page, 'second')).toBe('inline')
  }
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().cssText)).toBe(rendered.cssText)
})

test('a server render that already uses hidden reconciles its deferred usage without duplicating rules', async ({ page }) => {
  const rendered = await hydrateServerRender(
    page,
    '<span id="hidden" class="hidden">Hidden</span><p id="block" class="block">Block</p><span id="later">Later</span>',
    { lazyProgram: true, ready: false }
  )
  expect(rendered.cssText).toBe('@layer utilities{.block{display:block}.hidden{display:none}}')
  expect(rendered.hydrationManifest?.classNames).toEqual(['block', 'hidden'])

  // While deferred the page script reuses a hydrated class: usage only, no CSSOM change and no engine.
  await setClass(page, 'later', 'hidden', true)
  await waitForFrames(page)
  expect(await page.evaluate(() => ({
    engine: globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().engine,
    programLoads: globalThis.__MASTER_CSS_RUNTIME_PROGRAM_LOADS__
  }))).toEqual({ engine: 'deferred', programLoads: 0 })
  expect(await readClass(page, 'hidden')).toEqual({ usageCount: 2, rules: [], retained: false, cssomRules: 1 })
  expect(await display(page, 'later')).toBe('none')

  // Startup hydrates the pre-rendered rules once and adopts the counts recorded while deferred.
  await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.ready())
  expect(await page.evaluate(() => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    const snapshot = runtime.snapshot()
    return {
      engine: snapshot.engine,
      hydration: snapshot.hydration,
      utilityRules: runtime.utilitiesLayer.rules.map(({ name }) => name),
      cssText: snapshot.cssText
    }
  })).toEqual({
    engine: 'ready',
    hydration: { state: 'progressive', manifestLoaded: true },
    utilityRules: ['block', 'hidden'],
    cssText: rendered.cssText
  })
  expect(await readClass(page, 'hidden')).toEqual({ usageCount: 2, rules: ['.hidden{display:none}'], retained: false, cssomRules: 1 })
  expect(await readClass(page, 'block')).toEqual({ usageCount: 1, rules: ['.block{display:block}'], retained: false, cssomRules: 1 })

  // Explicitly ensuring a hydrated class does not duplicate its rule either.
  await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.ensureClassRules(['hidden', 'block']))
  expect(await readClass(page, 'hidden')).toEqual({ usageCount: 2, rules: ['.hidden{display:none}'], retained: false, cssomRules: 1 })
  expect(await readClass(page, 'block')).toEqual({ usageCount: 1, rules: ['.block{display:block}'], retained: false, cssomRules: 1 })

  await setClass(page, 'hidden', 'hidden', false)
  await setClass(page, 'later', 'hidden', false)
  await waitForFrames(page)
  expect(await readClass(page, 'hidden')).toEqual({ usageCount: 0, rules: ['.hidden{display:none}'], retained: true, cssomRules: 1 })
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules())).toBe(1)
  expect(await readClass(page, 'hidden')).toEqual(released)
  expect(await readClass(page, 'block')).toEqual({ usageCount: 1, rules: ['.block{display:block}'], retained: false, cssomRules: 1 })
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().cssText)).toBe('@layer utilities{.block{display:block}}')
  expect(await display(page, 'hidden')).toBe('inline')
})

test('parenthesized declarations with selector, condition and braced URL suffixes hydrate, toggle and release', async ({ page }) => {
  const conditional = '(display:block)[aria-expanded=true]:hover@sm'
  const braced = '(background-image:url(/a{b.svg))'
  const conditionalRule = '@media (width >= 52.125rem){.\\(display\\:block\\)\\[aria-expanded\\=true\\]\\:hover\\@sm[aria-expanded=true]:hover{display:block}}'
  const bracedRule = '.\\(background-image\\:url\\(\\/a\\{b\\.svg\\)\\){background-image:url(/a{b.svg)}'
  // Above the 52.125rem `@sm` breakpoint.
  await page.setViewportSize({ width: 1280, height: 720 })
  const rendered = await hydrateServerRender(page, [
    // Each span sits alone in a block, so turning it into a block under the pointer does not move it.
    `<div><span id="toggle" aria-expanded="true" class="${conditional}">Toggle</span></div>`,
    '<div><span id="other" aria-expanded="true">Other</span></div>',
    `<div id="image" class="${braced}"></div>`,
    '<div id="image-other"></div>'
  ].join(''))
  expect(rendered.cssText).toBe(`@layer utilities{${bracedRule}${conditionalRule}}`)
  expect(rendered.hydrationManifest?.classNames).toEqual([braced, conditional])
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration)).toEqual({ state: 'progressive', manifestLoaded: true })
  expect(await readClass(page, conditional)).toEqual({ usageCount: 1, rules: [conditionalRule], retained: false, cssomRules: 1 })
  expect(await readClass(page, braced)).toEqual({ usageCount: 1, rules: [bracedRule], retained: false, cssomRules: 1 })

  // The hydrated CSSOM rules apply: the selector suffix needs hover, the braced URL survives.
  expect(await display(page, 'toggle')).toBe('inline')
  await page.locator('#toggle').hover()
  expect(await display(page, 'toggle')).toBe('block')
  await page.mouse.move(0, 0)
  expect(await page.locator('#image').evaluate(element => getComputedStyle(element).backgroundImage)).toMatch(/\/a(\{|%7B)b\.svg/)

  // Page scripts add both classes to second elements: counts rise, CSSOM rules are shared.
  await setClass(page, 'other', conditional, true)
  await setClass(page, 'image-other', braced, true)
  await waitForFrames(page)
  expect(await readClass(page, conditional)).toEqual({ usageCount: 2, rules: [conditionalRule], retained: false, cssomRules: 1 })
  expect(await readClass(page, braced)).toEqual({ usageCount: 2, rules: [bracedRule], retained: false, cssomRules: 1 })
  await page.locator('#other').hover()
  expect(await display(page, 'other')).toBe('block')
  await page.mouse.move(0, 0)

  // Removing every reference releases both classes, then the cleanup boundary deletes their rules.
  for (const id of ['toggle', 'other']) await setClass(page, id, conditional, false)
  await setClass(page, 'image', braced, false)
  await waitForFrames(page)
  expect(await readClass(page, conditional)).toEqual({ usageCount: 0, rules: [conditionalRule], retained: true, cssomRules: 1 })
  expect(await readClass(page, braced)).toEqual({ usageCount: 1, rules: [bracedRule], retained: false, cssomRules: 1 })
  await setClass(page, 'image-other', braced, false)
  await waitForFrames(page)
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules())).toBe(2)
  expect(await readClass(page, conditional)).toEqual(released)
  expect(await readClass(page, braced)).toEqual(released)
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().cssText)).toBe('')
  await page.locator('#toggle').hover()
  expect(await display(page, 'toggle')).toBe('inline')

  // Reconnecting a released class inserts its rule again.
  await setClass(page, 'toggle', conditional, true)
  await waitForFrames(page)
  expect(await readClass(page, conditional)).toEqual({ usageCount: 1, rules: [conditionalRule], retained: false, cssomRules: 1 })
  expect(await display(page, 'toggle')).toBe('block')
})
