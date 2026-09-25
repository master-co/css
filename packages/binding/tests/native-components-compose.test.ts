import { expect, test } from 'vitest'
import { createCompilerBindingSession } from '../src/compiler-binding'

test('native and Wasm retain ordered compose output, source traces and migration decisions', async () => {
  using native = await createCompilerBindingSession({ binding: 'native' })
  using wasm = await createCompilerBindingSession({ binding: 'wasm' })
  const entry = '/entry.css'
  const definitions = '/utilities.css'
  const files = {
    [entry]: '@import "./utilities.css";@layer components{.button{@compose paint-red;display:block;display:made-up-value;padding-left:20px;padding:10px;padding-left:30px;@compose color:red;@compose color:blue;}}',
    [definitions]: '@theme{--color-accent:red;@keyframes spin{to{opacity:1}}}@utilities{paint-<red|blue>{color:var(--color-accent);animation:spin 1s}paint-<small|large>{font-size:--value()}}'
  }
  const request = { graph: { entry, files, edges: [{ from: entry, specifier: './utilities.css', resolved: definitions }] }, urls: { [entry]: entry, [definitions]: definitions } }
  const result = native.compileCSSStylesheetGraph(request)
  expect(wasm.compileCSSStylesheetGraph(request)).toEqual(result)
  const css = result.stylesheets.find(sheet => sheet.id === entry)!.css
  expect(css).toContain('display:block;display:made-up-value;padding-left:20px;padding:10px;padding-left:30px;color:red;color:blue')
  const trace = result.directives.compositions![0]
  expect(trace.classes).toEqual(['paint-red'])
  expect(trace.variableNames).toContain('color-accent')
  expect(trace.animationNames).toContain('spin')
  expect(trace.source?.file).toBe(entry)
  expect(trace.definitionSources.map(source => files[definitions].slice(source.range.start, source.range.end))).toEqual(['paint-<red|blue>'])

  for (const binding of [native, wasm]) {
    expect(() => binding.compileCSSDirectives('@components{button{display:block}}')).toThrow('has been removed')
    expect(() => binding.compileCSSStylesheetGraph({
      graph: { entry, files: { [entry]: '.button{@compose absent;}' }, edges: [] }, urls: { [entry]: entry }
    })).toThrow('Invalid @compose utility')
  }
  const migration = {
    from: 'rc-managed' as const, sourceVersion: '2.0.0-rc.managed',
    manifest: { version: 1 as const, languageVersion: 2 as const, utilities: [] },
    targetManifest: { version: 1 as const, languageVersion: 2 as const },
    stylesheets: ['@components{button{display:block}}.a{@compose button;}'],
    classLists: [['button:hover']], documents: []
  }
  const migrated = native.migrateRC(migration)
  expect(wasm.migrateRC(migration)).toEqual(migrated)
  expect(migrated.classLists[0][0].status).toBe('review')
  expect(migrated.stylesheets[0].notes.some(note => note.includes('@compose'))).toBe(true)
})
