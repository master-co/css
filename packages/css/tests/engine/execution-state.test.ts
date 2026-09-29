import { expect, test } from 'vitest'
import defaultManifest from '@master/css-preset/default-manifest.json'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import createEngine from '../../src/engine/create-engine'

const manifest = defaultManifest as unknown as MasterCSSManifest

test.each(['native', 'wasm'] as const)('%s executionState returns immutable stored references and current resources', async (binding) => {
  const engine = await createEngine({ manifest, binding })
  try {
    expect(engine.inspect("display:block").matchStatus).toBe('matched')
    expect(engine.executionState(["display:block"]).classes).toEqual([{ className: "display:block", references: [] }])
    const classes = ["display:block", 'fg-red-60', "display:block@base", 'unknown', "display:block"]
    engine.ensureClassRules(classes)
    const snapshot = engine.snapshot()
    const state = engine.executionState(classes)
    expect(state.resources).toEqual(snapshot.resources)
    expect(state.classes).toEqual(classes.map(className => ({
      className,
      references: snapshot.rules.filter(rule => rule.className === className)
        .map(({ layer, key }) => ({ layer, key }))
    })))
    expect(Object.keys(state)).toEqual(['classes', 'resources'])
    expect(Object.isFrozen(state)).toBe(true)
    expect(Object.isFrozen(state.classes[0].references[0])).toBe(true)
    expect(engine.snapshot()).toEqual(snapshot)
    expect(engine.ensureClassRules(["display:block"]).mutations).toEqual([])
    expect(engine.executionState(classes)).toEqual(state)
    engine.deleteClassRules(["display:block"])
    expect(engine.executionState(["display:block"]).classes[0].references).toEqual([])
    engine.refresh({
  "version": 3 as const,
  "languageVersion": 5 as const
})
    expect(engine.executionState(["display:block@base"]).classes[0].references).toEqual([])
  } finally {
    engine.dispose()
  }
  expect(() => engine.executionState([])).toThrow(/disposed/)
})
