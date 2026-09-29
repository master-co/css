import { expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createCompilerBindingSession } from '../src/compiler-binding'
import { createEngineBindingSession } from '../src/engine-binding'

test('native and Wasm agree on entry replacement, equal-value ambiguity and removed sizes', async () => {
  const manifest: MasterCSSManifest = { version: 4, languageVersion: 6,
    variables: { 'font-size': [{ key: 'brand', values: [{ path: [':root'], value: 'red' }] }], 'font-family': [{ key: 'brand', values: [{ path: [':root'], value: 'red' }] }] },
    mixins: [
      ...['size', 'box'].map(name => ({ name: `--${name}`, parameters: [{ name: '--value' }], body: [{ type: 'declaration' as const, property: 'width', value: [{ type: 'function' as const, name: 'var', value: [{ type: 'text' as const, value: '--value' }] }] }] })),
      { name: '--size', parameters: [{ name: '--value' }], body: [{ type: 'declaration', property: 'height', value: [{ type: 'function', name: 'var', value: [{ type: 'text', value: '--value' }] }] }] }
    ]
  }
  using native = await createEngineBindingSession({ manifest }, { binding: 'native' })
  using wasm = await createEngineBindingSession({ manifest }, { binding: 'wasm' })
  for (const session of [native, wasm]) {
    expect(session.inspect('font-brand').matchStatus).toBe('ambiguous')
    session.ensureClassRules(['size(20px)', 'box(30px)', 'max-size:40px'])
    expect(session.snapshot().text).toContain('.size\\(20px\\){height:20px}')
    expect(session.snapshot().text).toContain('.box\\(30px\\){width:30px}')
    expect(session.snapshot().text).toContain('{max-size:40px}')
  }
  expect(wasm.snapshot()).toEqual(native.snapshot())
})

test('ABI 16 exposes rc-sizing migration with identical native and Wasm decisions', async () => {
  using native = await createCompilerBindingSession({ binding: 'native' })
  using wasm = await createCompilerBindingSession({ binding: 'wasm' })
  const targetManifest = {
  "version": 4 as const,
  "languageVersion": 6 as const
}
  const request = { from: 'rc-sizing' as const, sourceVersion: '2.0.0-rc.sizing', targetManifest,
    manifest: { ...targetManifest, version: 1 as const, languageVersion: 3 as const, utilities: [{ id: 'size:<*>', type: -1,
      matchers: [{ type: 'key' as const, keys: ['size'] }], emit: { type: 'static' as const, rules: [{ declarations: { width: null, height: null } }] } }] },
    classLists: [['size:20px:hover!'], ['size:20px', 'width:30px']], stylesheets: [], documents: [] }
  const result = native.migrateRC(request)
  expect(wasm.migrateRC(request)).toEqual(result)
  expect(result.classLists[0][0]).toMatchObject({ status: 'replace', after: '{width:20px;height:20px}:hover!' })
  expect(result.classLists[1].every(item => item.status === 'review')).toBe(true)
})

test('migration providers preserve a custom entry that shadows a historical sizing alias', async () => {
  using native = await createCompilerBindingSession({ binding: 'native' })
  using wasm = await createCompilerBindingSession({ binding: 'wasm' })
  const custom = { id: 'project-min', type: -1, matchers: [{ type: 'key' as const, keys: ['min'] }], emit: { type: 'property' as const, property: 'inline-size' } }
  const targetManifest: MasterCSSManifest = { version: 4, languageVersion: 6, mixins: [{ name: '--min', parameters: [{ name: '--value' }], body: [{ type: 'declaration', property: 'inline-size', value: [{ type: 'function', name: 'var', value: [{ type: 'text', value: '--value' }] }] }] }] }
  const request = { from: 'rc-sizing' as const, sourceVersion: '2.0.0-rc.sizing', targetManifest,
    manifest: { ...targetManifest, version: 1 as const, languageVersion: 3 as const, utilities: [custom, { id: 'min-size:<*>', type: -1,
      matchers: [{ type: 'key' as const, keys: ['min-size'] }], emit: { type: 'static' as const, rules: [{ declarations: { 'min-width': null, 'min-height': null } }] } }] },
    classLists: [['min:20px'], ['min-size:20px']], stylesheets: [], documents: [] }
  const result = native.migrateRC(request)
  expect(wasm.migrateRC(request)).toEqual(result)
  expect(result.classLists[0][0]).toMatchObject({status:'replace', after:'min(20px)'})
  expect(result.classLists[1][0]).toMatchObject({ status: 'replace', after: '{min-width:20px;min-height:20px}' })
})
