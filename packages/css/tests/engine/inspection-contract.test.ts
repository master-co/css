import { expect, expectTypeOf, test } from 'vitest'
import { createEngine, type MasterCSSEngineInspection } from '@master/css'
import defaultManifest from '@master/css-preset/default-manifest.json'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const manifest = defaultManifest as unknown as MasterCSSManifest

test.each(['native', 'wasm'] as const)('%s exposes typed syntax status and optional inspection diagnostics', async (binding) => {
  using engine = await createEngine({ manifest, binding })
  const before = engine.snapshot()
  const valid: MasterCSSEngineInspection = engine.inspect('padding:red')
  expectTypeOf(valid.cssSyntaxStatus).toEqualTypeOf<'valid' | 'invalid' | 'unknown' | 'not-checked'>()
  // Inspection recognizes the declaration syntax without validating its value.
  expect(valid.matchStatus).toBe('matched')
  expect(valid.cssSyntaxStatus).toBe('valid')
  expect(valid.cssValueStatus).toBe('not-checked')
  expect(valid.browserSupport).toBe('not-checked')
  expect(valid.diagnostics).toBeUndefined()

  const invalid: MasterCSSEngineInspection = engine.inspect('padding:1px.<br')
  expect(invalid.matchStatus).toBe('syntax-error')
  expect(invalid.cssSyntaxStatus).toBe('invalid')
  expect(invalid.diagnostics?.map(({ code }) => code)).toContain('CLASS_SYNTAX_ERROR')
  expect(Object.isFrozen(invalid.diagnostics)).toBe(true)
  expect(Object.isFrozen(invalid.diagnostics?.[0])).toBe(true)

  const unknown = engine.inspect('block@inspection-undefined')
  expect(unknown.cssSyntaxStatus).toBe('not-checked')
  expect(unknown.diagnostics?.map(({ code }) => code)).toContain('UNKNOWN_CONDITION')
  expect(engine.snapshot()).toEqual(before)
})
