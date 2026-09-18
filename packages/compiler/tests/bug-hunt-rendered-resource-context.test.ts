import { expect, test } from 'vitest'
import { compileRenderedStylesheet } from '../src/stylesheet/index-public'
import { compileBrowserStylesheet } from '../src/stylesheet/browser'

const baseManifest = { version: 1 as const, utilities: [] }
const definitions = '@theme{--color-old:#111111;--color-late:var(--color-dependency);--color-dependency:#abcdef;@keyframes audit{from{opacity:0}to{opacity:1}}}'
const initialSource = definitions + '.card{color:var(--color-old)}'
// A host has modified the old generated value and introduced new resources.
const processed = '.card{color:var(--color-old);background:var(--color-late);animation:audit 1s}@layer theme{:root{--color-old:#123456}}'

for (const mode of ['node', 'wasm'] as const) {
  test(`${mode} rendered resource context emits the new transitive closure without overwriting processed globals`, async () => {
    const first = await compileRenderedStylesheet('/audit/entry.css', initialSource, { baseManifest })
    const emittedGlobals = Object.freeze({
      variables: Object.freeze({ ...first.emittedGlobals.variables }),
      animations: Object.freeze({ ...first.emittedGlobals.animations })
    })
    const before = JSON.stringify(emittedGlobals)
    const options = { baseManifest: first.manifest, emittedGlobals }
    const result = mode === 'node'
      ? await compileRenderedStylesheet('/audit/entry.css', processed, options)
      : await compileBrowserStylesheet(processed, options)
    expect(result.generatedCSS).toContain('--color-late:var(--color-dependency)')
    expect(result.generatedCSS).toContain('--color-dependency:#abcdef')
    expect(result.generatedCSS).toContain('@keyframes audit')
    expect(result.generatedCSS).not.toContain('--color-old:')
    expect(result.css).toMatch(/--color-old:\s*#123456/)
    expect(result.css).not.toMatch(/--color-old:\s*#111/)
    expect(result.css.match(/--color-old:/g)).toHaveLength(1)
    expect(result.emittedGlobals.variables['color-late']).toBeGreaterThan(0)
    expect(result.emittedGlobals.animations.audit).toBeGreaterThan(0)
    expect(JSON.stringify(emittedGlobals)).toBe(before)
    const legacy = mode === 'node'
      ? await compileRenderedStylesheet('/audit/entry.css', processed, { baseManifest: first.manifest })
      : await compileBrowserStylesheet(processed, { baseManifest: first.manifest })
    expect(legacy.generatedCSS).toContain('--color-old:')
  })
}

test('delivered graph uses external resource context across qualified child boundaries', async () => {
  const first = await compileRenderedStylesheet('/audit/entry.css', initialSource, { baseManifest })
  const result = await compileRenderedStylesheet('/audit/entry.css', '@import "./child.css" layer(child);', {
    baseManifest: first.manifest,
    emittedGlobals: first.emittedGlobals,
    delivery: {
      entryURL: './entry.css', stylesheetURL: () => './child-output.css', resourceURL: file => file,
      resolveImport: async () => ({ id: '/audit/child.css', source: processed })
    }
  })
  expect(result.stylesheets).toHaveLength(2)
  expect(result.css).toContain('layer(child)')
  expect(result.generatedCSS).toContain('--color-late:')
  expect(result.generatedCSS).not.toContain('--color-old:')
  expect(result.stylesheets!.find(asset => asset.id !== result.entry)!.css).toMatch(/--color-old:\s*#123456/)
})

test('zero external counts do not suppress required resources', async () => {
  const result = await compileRenderedStylesheet('/audit/entry.css', initialSource, {
    baseManifest, emittedGlobals: { variables: { 'color-old': 0 }, animations: {} }
  })
  expect(result.generatedCSS).toContain('--color-old:')
})
