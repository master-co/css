import { expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createCompilerBindingSession } from '../src/compiler-binding'
import { createEngineBindingSession } from '../src/engine-binding'

test('native and Wasm agree on entry replacement, equal-value ambiguity and removed sizes', async () => {
  const manifest = { theme: [{ type: 'rule', prelude: ':root,:host', children: [{ type: 'declaration', name: "a-brand", value: 'red' }, { type: 'declaration', name: "b-brand", value: 'red' }] }], version: 2, languageVersion: 4, variables: {
    a: [{ key: 'brand', values: [{ path: [':root,:host'], value: 'red' }] }], b: [{ key: 'brand', values: [{ path: [':root,:host'], value: 'red' }] }]
  }, utilities: [
    { id: 'old', type: -1, matchers: [{ type: 'key', keys: ['size', 'box'] }], emit: { type: 'property', property: 'width' } },
    { id: 'new', type: -1, matchers: [{ type: 'key', keys: ['size'] }], emit: { type: 'property', property: 'height' } },
    ...['a', 'b'].map(namespace => ({ id: namespace, type: 0, variableAliasRefs: [`~${namespace}`], matchers: [{ type: 'token', prefix: 'paint-' }], emit: { type: 'property', property: 'color' } }))
  ] } as unknown as MasterCSSManifest
  using native = await createEngineBindingSession({ manifest }, { binding: 'native' })
  using wasm = await createEngineBindingSession({ manifest }, { binding: 'wasm' })
  for (const session of [native, wasm]) {
    expect(session.inspect('paint-brand').matchStatus).toBe('ambiguous')
    session.ensureClassRules(['size:20px', 'box:30px', 'max-size:40px'])
    expect(session.snapshot().text).toContain('.size\\:20px{height:20px}')
    expect(session.snapshot().text).toContain('.box\\:30px{width:30px}')
    expect(session.snapshot().text).toContain('{max-size:40px}')
  }
  expect(wasm.snapshot()).toEqual(native.snapshot())
})

test('ABI 15 exposes rc-sizing migration with identical native and Wasm decisions', async () => {
  using native = await createCompilerBindingSession({ binding: 'native' })
  using wasm = await createCompilerBindingSession({ binding: 'wasm' })
  const targetManifest = { version: 2 as const, languageVersion: 4 as const, utilities: [] }
  const request = { from: 'rc-sizing' as const, sourceVersion: '2.0.0-rc.sizing', targetManifest,
    manifest: { ...targetManifest, version: 1, languageVersion: 3, utilities: [{ id: 'size:<*>', type: -1,
      matchers: [{ type: 'key', keys: ['size'] }], emit: { type: 'static', rules: [{ declarations: { width: null, height: null } }] } }] },
    classLists: [['size:20px:hover!'], ['size:20px', 'width:30px']], stylesheets: [], documents: [] }
  const result = native.migrateRC(request)
  expect(wasm.migrateRC(request)).toEqual(result)
  expect(result.classLists[0][0]).toMatchObject({ status: 'replace', after: '{width:20px;height:20px}:hover!' })
  expect(result.classLists[1].every(item => item.status === 'review')).toBe(true)
})

test('migration providers preserve a custom entry that shadows a historical sizing alias', async () => {
  using native = await createCompilerBindingSession({ binding: 'native' })
  using wasm = await createCompilerBindingSession({ binding: 'wasm' })
  const custom: NonNullable<MasterCSSManifest['utilities']>[number] = { id: 'project-min', type: -1, matchers: [{ type: 'key', keys: ['min'] }], emit: { type: 'property', property: 'inline-size' } }
  const targetManifest = { version: 2 as const, languageVersion: 4 as const, utilities: [custom] }
  const request = { from: 'rc-sizing' as const, sourceVersion: '2.0.0-rc.sizing', targetManifest,
    manifest: { ...targetManifest, version: 1, languageVersion: 3, utilities: [...targetManifest.utilities, { id: 'min-size:<*>', type: -1,
      matchers: [{ type: 'key', keys: ['min-size'] }], emit: { type: 'static', rules: [{ declarations: { 'min-width': null, 'min-height': null } }] } }] },
    classLists: [['min:20px'], ['min-size:20px']], stylesheets: [], documents: [] }
  const result = native.migrateRC(request)
  expect(wasm.migrateRC(request)).toEqual(result)
  expect(result.classLists[0][0].status).toBe('unchanged')
  expect(result.classLists[1][0]).toMatchObject({ status: 'replace', after: '{min-width:20px;min-height:20px}' })
})
