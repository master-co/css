import { expect, test } from '@playwright/test'
import { compileManifestSync } from '@master/css-compiler/node'
import { renderClassNamesSync } from '@master/css/node'
import { createServerRenderer } from '@master/css-server'
import { getRuntimeLoaderURL } from './init'

const compiled = compileManifestSync(`
@mixin --bg(--color){background-color:var(--color)}
@mixin --p(--spacing){padding:var(--spacing)}
@layer theme, base, defaults, components, utilities;
:root { color-scheme: light dark; }
[data-theme=light] { color-scheme: light; }
[data-theme=dark] { color-scheme: dark; }
@theme {
  --color-base: light-dark(white, black);
  --color-brand: red;
}
@theme inline { --color-alias: var(--color-base); --spacing-card: 12px; }
@layer theme {

  [data-theme=ocean], :host([data-theme=ocean]) { --color-brand: blue; }
}
`, { baseManifest: { version: 5, languageVersion: 14 } })
const { manifest } = compiled
const nativeCSS = compiled.css
const classes = ['bg-alias', 'bg-brand', 'p-card']
const html = `<!doctype html><html><head><style id="native">${nativeCSS}</style></head><body>
  <div id="sample" class="bg-alias p-card">Default</div>
  <section id="ocean" data-theme="ocean" class="bg-brand">
    <div id="nested" data-theme="light" class="bg-alias"><span id="brand" class="bg-brand">Nested brand</span></div>
  </section>
</body></html>`

for (const mode of ['static', 'ssr', 'runtime', 'progressive'] as const) {
  test(`${mode}: inline tokens, nested data-theme and managed dependencies`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const generated = renderClassNamesSync(classes, { manifest })
    expect(generated.cssText).toContain('--color-base:')
    expect(generated.cssText).not.toContain('--color-alias:')
    expect(generated.cssText).not.toContain('--spacing-card:')
    if (mode === 'static') {
      await page.setContent(html.replace('</head>', `<style>${generated.cssText}</style></head>`))
    } else if (mode === 'runtime') {
      await page.setContent(html)
    } else {
      using renderer = createServerRenderer({ manifest })
      const rendered = renderer.renderHTML(html, { hydrationManifest: 'inject' })
      expect(rendered.cssText).toBe(generated.cssText)
      await page.setContent(rendered.html)
    }
    if (mode === 'runtime' || mode === 'progressive') {
      await page.evaluate(async ({ loader, manifest }) => {
        const { startCSSRuntime } = await import(loader)
        await startCSSRuntime({ manifest })
      }, { loader: await getRuntimeLoaderURL(), manifest })
    }
    await expect(page.locator('#sample')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await expect(page.locator('#sample')).toHaveCSS('padding', '12px')
    await expect(page.locator('#nested')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(page.locator('#brand')).toHaveCSS('background-color', 'rgb(0, 0, 255)')
    const before = await page.locator('head').innerHTML()
    await page.locator('html').evaluate(element => element.setAttribute('data-theme', 'light'))
    await expect(page.locator('#sample')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await page.locator('html').evaluate(element => element.setAttribute('data-theme', 'dark'))
    await expect(page.locator('#sample')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await page.locator('html').evaluate(element => element.removeAttribute('data-theme'))
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.locator('#sample')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    expect(await page.locator('head').innerHTML()).toBe(before)
    await expect(page.locator('#brand')).toHaveCSS('background-color', 'rgb(0, 0, 255)')
  })
}

test('default shorthand and explicit native host overrides work inside shadow roots', async ({ page }) => {
  const generated = renderClassNamesSync(classes, { manifest })
  await page.setContent('<div id="host" data-theme="ocean"></div>')
  await page.locator('#host').evaluate((host, css) => {
    host.attachShadow({ mode: 'open' }).innerHTML = `<style>${css}</style><span id="shadow" class="bg-brand p-card">Shadow</span>`
  }, nativeCSS + generated.cssText)
  await expect(page.locator('#shadow')).toHaveCSS('background-color', 'rgb(0, 0, 255)')
  await expect(page.locator('#shadow')).toHaveCSS('padding', '12px')
  await page.locator('#host').evaluate(host => host.removeAttribute('data-theme'))
  await expect(page.locator('#shadow')).toHaveCSS('background-color', 'rgb(255, 0, 0)')
})

for (const hydrate of [false, true]) {
  test(`static resources survive zero classes, mutation and HMR (hydrate=${hydrate})`, async ({ page }) => {
    const source = '@mixin --bg(--color){background-color:var(--color)}@mixin --animate(--animate){animation:var(--animate)}@theme static inline{--color-fixed:red;--animate-enter:enter 1s}@prune native;@theme{--color-frame:blue;}@keyframes enter{to{color:var(--color-frame)}}@keyframes unused{to{opacity:0}}'
    const { manifest } = compileManifestSync(source, { baseManifest: { version: 5, languageVersion: 14 } })
    const content = '<!doctype html><html><head></head><body><div id="target"></div></body></html>'
    using renderer = createServerRenderer({ manifest })
    const rendered = renderer.renderHTML(content, { hydrationManifest: 'inject' })
    expect(rendered.cssText).toContain('--color-fixed:red')
    expect(rendered.cssText).toContain('@keyframes enter')
    await page.setContent(hydrate ? rendered.html : content)
    await page.evaluate(async ({ loader, manifest }) => {
      const { startCSSRuntime } = await import(loader)
      await startCSSRuntime({ manifest })
    }, { loader: await getRuntimeLoaderURL(), manifest })
    const resources = () => page.evaluate(() => ({
      names: [...document.querySelector<HTMLStyleElement>('#master-css')!.sheet!.cssRules]
        .filter((rule): rule is CSSKeyframesRule => rule instanceof CSSKeyframesRule).map(rule => rule.name),
      fixed: getComputedStyle(document.documentElement).getPropertyValue('--color-fixed').trim()
    }))
    expect(await resources()).toEqual({ names: ['enter'], fixed: 'red' })
    await page.locator('#target').evaluate(element => { element.className = 'bg-fixed animate-enter' })
    await expect(page.locator('#target')).toHaveCSS('background-color', 'rgb(255, 0, 0)')
    expect(await resources()).toEqual({ names: ['enter'], fixed: 'red' })
    await page.locator('#target').evaluate(element => { element.className = '' })
    await expect(page.locator('#target')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect.poll(() => page.evaluate(() => globalThis.masterCSSRuntime.snapshot().classRules['animate-enter']?.usageCount ?? 0)).toBe(0)
    await expect.poll(() => page.evaluate(() => globalThis.masterCSSRuntime.snapshot().classRules['animate-enter']?.retained ?? false)).toBe(false)
    await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules())
    expect(await resources()).toEqual({ names: ['enter'], fixed: 'red' })
    const refreshed = compileManifestSync(source.replace('static inline', 'inline'), { baseManifest: { version: 5, languageVersion: 14 } }).manifest
    await page.evaluate(manifest => globalThis.masterCSSRuntime.refresh(manifest), refreshed)
    expect(await resources()).toEqual({ names: [], fixed: '' })
  })
}
