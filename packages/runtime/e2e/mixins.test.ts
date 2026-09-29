import { test, expect } from '@playwright/test'
import { compileManifestSync } from '@master/css-compiler/node'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import { renderClassNamesSync } from '@master/css/node'
import { createServerRenderer } from '@master/css-server'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { getRuntimeLoaderURL } from './init'

const baseManifest = preset as unknown as MasterCSSManifest
const source = `@theme { :root, :host { --text-hero: 30px; --text-unused: 100px; } }
@mixin --nested(--count <integer>) { @apply --grid-cols(var(--count)); }
@mixin --unused { @apply --text("unused"); }`
const manifest = compileManifestSync(source, { baseManifest }).manifest
const classes = ['nested(3)', 'text-hero', 'font-size:24px']

for (const mode of ['static', 'ssr', 'runtime', 'progressive'] as const) {
  test(`${mode}: named and nested parameter mixins generate on demand and hydrate consistently`, async ({ page }) => {
    const html = '<html><head></head><body><div id="grid" class="nested(3)"></div><p id="text" class="text-hero font-size:24px">Hero</p></body></html>'
    const generated = renderClassNamesSync(classes, { manifest })
    expect(generated.cssText).toContain('--text-hero:30px')
    expect(generated.cssText).not.toContain('--text-unused')
    if (mode === 'static') await page.setContent(html.replace('</head>', `<style>${generated.cssText}</style></head>`))
    else if (mode === 'runtime') await page.setContent(html)
    else {
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
      expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration.state)).toBe(mode)
    }
    await expect(page.locator('#grid')).toHaveCSS('display', 'grid')
    expect((await page.locator('#grid').evaluate(el => getComputedStyle(el).gridTemplateColumns)).split(' ')).toHaveLength(3)
    await expect(page.locator('#text')).toHaveCSS('font-size', '24px')
    await expect(page.locator('#text')).toHaveCSS('line-height', 'normal')
    if (mode === 'runtime' || mode === 'progressive') {
      await page.locator('#text').evaluate(el => { el.className = 'text-hero' })
      await expect(page.locator('#text')).toHaveCSS('font-size', '30px')
      await page.locator('#grid').evaluate(el => { el.className = 'nested(2)' })
      await expect.poll(async () => (await page.locator('#grid').evaluate(el => getComputedStyle(el).gridTemplateColumns)).split(' ').length).toBe(2)
      await page.locator('#text').evaluate(el => { el.className = '' })
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => { globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules(); resolve() }))))
      await expect.poll(() => page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().cssText)).not.toContain('--text-hero')
      const updated = compileManifestSync(source.replace('30px', '36px'), { baseManifest }).manifest
      await page.evaluate(manifest => { globalThis.__MASTER_CSS_RUNTIME_TEST__.refresh(manifest); document.querySelector('#text')!.className = 'text-hero' }, updated)
      await expect(page.locator('#text')).toHaveCSS('font-size', '36px')
    }
  })
}

test('native apply expands in place and keeps its theme dependencies after DOM roots disappear', async ({ page }) => {
  const compiled = await compileRenderedStylesheet('/project/mixins.css', `${source}\n.caption { @apply --text("hero"); }`, { baseManifest, preserveNativeCSS: true })
  expect(compiled.css).toContain('--text-hero')
  expect(compiled.css).not.toContain('.text-hero')
  expect(compiled.css).not.toContain('--text-unused')
  expect(compiled.emittedGlobals.variables).toHaveProperty('text-hero')
  await page.setContent(`<style>${compiled.css}</style><p class="caption">Native</p><p id="dynamic" class="text-hero">Dynamic</p>`)
  await page.evaluate(async ({ loader, manifest, emittedGlobals }) => {
    const { startCSSRuntime } = await import(loader)
    await startCSSRuntime({ manifest, emittedGlobals })
  }, { loader: await getRuntimeLoaderURL(), manifest: compiled.manifest, emittedGlobals: compiled.emittedGlobals })
  await expect(page.locator('.caption')).toHaveCSS('font-size', '30px')
  await expect(page.locator('#dynamic')).toHaveCSS('font-size', '30px')
  await page.locator('#dynamic').evaluate(el => { el.className = '' })
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => { globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules(); resolve() }))))
  await expect(page.locator('.caption')).toHaveCSS('font-size', '30px')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().cssText)).not.toContain('.text-hero')
})

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`preset typography keeps explicit metrics at ${viewport.width}px`, async ({ page }) => {
    const steps = [
      ['3xs', 8, 1.5, 0], ['2xs', 10, 1.5, 0], ['xs', 12, 1.5, 0], ['sm', 14, 1.5, 0],
      ['md', 16, 1.6, 0], ['lg', 18, 1.5, 0], ['xl', 20, 1.4, -.01], ['2xl', 24, 1.35, -.015],
      ['3xl', 32, 1.25, -.02], ['4xl', 36, 1.2, -.025], ['5xl', 40, 1.15, -.03], ['6xl', 48, 1.1, -.035],
      ['7xl', 60, 1.05, -.04], ['8xl', 72, 1.05, -.04], ['9xl', 96, 1, -.045], ['10xl', 128, 1, -.05]
    ] as const
    await page.setViewportSize(viewport)
    const rendered = renderClassNamesSync([...steps.map(([step]) => `text-${step}`), 'text-4xl', 'text-5xl@sm', 'font-family-sans', 'font-size-sm'], { manifest: baseManifest })
    await page.setContent(`<style>html{font-size:16px}body{margin:0;padding:24px;box-sizing:border-box}h1,p{margin:0 0 16px}.metrics{position:absolute;visibility:hidden}</style><style>${rendered.cssText}</style><main class="font-family-sans"><h1 class="text-4xl text-5xl@sm">Designing for consistency across every platform.</h1><p class="text-md">A consistent type scale keeps headings and body text readable. Typography should wrap naturally on a phone and retain the same explicit line height on a desktop.</p><p id="font-only" class="font-size-sm">A single font-size token.</p>${steps.map(([step]) => `<span id="step-${step}" class="metrics text-${step}">Ag</span>`).join('')}</main>`)
    for (const [step, size, lineHeight, spacing] of steps) {
      const metrics = await page.locator(`#step-${step}`).evaluate(element => {
        const style = getComputedStyle(element)
        return [parseFloat(style.fontSize), parseFloat(style.lineHeight), style.letterSpacing === 'normal' ? 0 : parseFloat(style.letterSpacing)]
      })
      expect(metrics[0]).toBe(size)
      expect(metrics[1]).toBeCloseTo(size * lineHeight, 2)
      expect(metrics[2]).toBeCloseTo(size * spacing, 2)
    }
    await expect(page.locator('h1')).toHaveCSS('font-size', viewport.width < 834 ? '36px' : '40px')
    await expect(page.locator('#font-only')).toHaveCSS('line-height', 'normal')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width)
  })
}
