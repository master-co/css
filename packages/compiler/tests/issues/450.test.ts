import { expect, test } from 'vitest'
import { createCompiler } from '@master/css-compiler'
import { createEngine } from '@master/css'
import { serializeMasterCSSManifest, type MasterCSSManifest } from '@master/css-schema/manifest'

const minimal: MasterCSSManifest = {
  version: 1,
  languageVersion: 3,
  utilities: [{
    id: 'audit-block', type: -2,
    matchers: [{ type: 'static', name: 'audit-block' }],
    emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] }
  }]
}

test.each(['native', 'wasm'] as const)('450: %s codec reload preserves ordered declarations and resource lifetimes', async (binding) => {
  using compiler = await createCompiler({ binding })
  const { manifest } = compiler.compileManifest(`
    @theme {
      --color-root: red;
      --color-brand: var(--color-root);
      @keyframes audit-fade { from { color: var(--color-brand); } to { opacity: 1; } }
    }
    @utilities {
      audit-paint { color: var(--color-brand); display: block; display: flex; }
      audit-motion { animation: audit-fade 1s; }
    }
  `, { baseManifest: minimal })
  const wire = serializeMasterCSSManifest(manifest)
  const reloaded: MasterCSSManifest = JSON.parse(wire)
  expect(serializeMasterCSSManifest(reloaded)).toBe(wire)
  using original = await createEngine({ manifest, binding })
  using restored = await createEngine({ manifest: reloaded, binding })
  const classes = ['audit-block', 'audit-paint', 'audit-motion']
  for (const className of classes) expect(restored.inspect(className)).toEqual(original.inspect(className))
  original.ensureClassRules(classes)
  restored.ensureClassRules(classes)
  expect(restored.snapshot()).toEqual(original.snapshot())
  const paintRules = restored.inspect('audit-paint').rules.map(rule => rule.text).join('')
  expect([...paintRules.matchAll(/display:([^;}]+)/g)].map(match => match[1])).toEqual(['block', 'flex'])
  expect(restored.snapshot().resources.variables.map(item => item.name)).toEqual(expect.arrayContaining(['color-root', 'color-brand']))
  expect(restored.snapshot().resources.animations.map(item => item.name)).toEqual(['audit-fade'])
  for (const className of classes) {
    expect(restored.deleteClassRules([className])).toEqual(original.deleteClassRules([className]))
    expect(restored.snapshot()).toEqual(original.snapshot())
  }
  expect(restored.snapshot().resources.variables).toEqual([])
  expect(restored.snapshot().resources.animations).toEqual([])
})

test.each(['native', 'wasm'] as const)('450: %s validates execution versions independently of codec serialization', async (binding) => {
  for (const invalid of [
    { languageVersion: 3 },
    { version: 99, languageVersion: 3 },
    { version: 1 },
    { version: 1, languageVersion: 99 },
    { ...minimal, utilityBuckets: {} },
    { ...minimal, modes: [{ name: 'audit', branches: [{ selector: '.audit', future: true }] }] }
  ]) {
    // The codec is deliberately not a validator. Validation belongs to Rust.
    const wire = serializeMasterCSSManifest(invalid as MasterCSSManifest)
    await expect(createEngine({ manifest: JSON.parse(wire), binding })).rejects.toThrow()
  }
  const extensible = { ...minimal, auditMetadata: { retained: true } }
  const reloaded = JSON.parse(serializeMasterCSSManifest(extensible))
  expect(reloaded.auditMetadata).toEqual({ retained: true })
  using engine = await createEngine({ manifest: reloaded, binding })
  expect(engine.inspect('audit-block').matchStatus).toBe('matched')
})
