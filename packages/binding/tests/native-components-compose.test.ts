import { expect, test } from 'vitest'
import { createCompilerBindingSession } from '../src/compiler-binding'

test('native and Wasm retain ordered native output, resource references and migration decisions', async () => {
  using native = await createCompilerBindingSession({ binding: 'native' })
  using wasm = await createCompilerBindingSession({ binding: 'wasm' })
  const entry = '/entry.css'
  const definitions = '/utilities.css'
  const files = {
    [entry]: "@import \"./utilities.css\";@layer components{.button{@apply --always {color:var(--color-accent);animation:1s spin;display:block;display:made-up-value;padding-left:20px;padding:10px;padding-left:30px;color:red;color:blue;}}}",
    [definitions]: `@mixin --always { @media all { @contents; } } @utility always { @media all { @contents; } }@theme {--color-accent:red; }
@keyframes spin{to{opacity:1}}
@mixin --paint-red {color:var(--color-accent);animation:spin 1s} @utility paint-red {color:var(--color-accent);animation:spin 1s}@mixin --paint-blue {color:var(--color-accent);animation:spin 1s} @utility paint-blue {color:var(--color-accent);animation:spin 1s}@mixin --paint-small {font-size:small} @utility paint-small {font-size:small}@mixin --paint-large {font-size:large} @utility paint-large {font-size:large}`
  }
  const request = { graph: { entry, files, edges: [{ from: entry, specifier: './utilities.css', resolved: definitions }] }, urls: { [entry]: entry, [definitions]: definitions } }
  const result = native.compileCSSStylesheetGraph(request)
  expect(wasm.compileCSSStylesheetGraph(request)).toEqual(result)
  const css = result.stylesheets.find(sheet => sheet.id === entry)!.css
  expect(css).toContain('display:block;display:made-up-value;padding-left:20px;padding:10px;padding-left:30px;color:red;color:blue')

  for (const binding of [native, wasm]) {
    expect(() => binding.compileCSSDirectives('@components{button{display:block}}')).toThrow('has been removed')
    expect(() => binding.compileCSSStylesheetGraph({
      graph: { entry, files: { [entry]: '.button{@compose absent;}' }, edges: [] }, urls: { [entry]: entry }
    })).toThrow('@compose has been removed')
  }
  const migration = {
    from: 'rc-managed' as const, sourceVersion: '2.0.0-rc.managed',
    manifest: { version: 1 as const, languageVersion: 3 as const, utilities: [] },
    targetManifest: {
  "version": 6 as const,
  "languageVersion": 16 as const
},
    stylesheets: ['@components{button{display:block}}.a{@compose button;}'],
    classLists: [['button:hover']], documents: []
  }
  const migrated = native.migrateRC(migration)
  expect(wasm.migrateRC(migration)).toEqual(migrated)
  expect(migrated.classLists[0][0].status).toBe('review')
  expect(migrated.stylesheets[0].notes.some(note => note.includes('@compose'))).toBe(true)
})
