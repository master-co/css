import { expect, test } from 'vitest'
import { createEngine } from '@master/css'
import { compileRenderedStylesheet } from '../src/stylesheet'
import { readFileSync } from 'node:fs'

const cases = JSON.parse(readFileSync(new URL('./bug-hunt-static-retention.json', import.meta.url), 'utf8')) as { id: string, css: string, names: string[] }[]

for (const entry of cases) {
  test(`BH-0003: ${entry.id} static graph survives public compile and class lifetimes`, async () => {
    const compiled = await compileRenderedStylesheet('/static.css', entry.css, { baseManifest: { version: 1, languageVersion: 3, utilities: [] } })
    const snapshots = []
    for (const binding of ['native', 'wasm'] as const) {
      const engine = await createEngine({ manifest: compiled.manifest, binding })
      try {
        const initial = engine.snapshot()
        expect(initial.resources.variables.map(variable => variable.name).sort()).toEqual(entry.names)
        expect(compiled.generatedCSS).toBe(initial.text)
        engine.ensureClassRules(['fg-brand'])
        engine.deleteClassRules(['fg-brand'])
        expect(engine.snapshot()).toEqual(initial)
        snapshots.push(initial)
      } finally { engine.dispose() }
    }
    expect(snapshots[0]).toEqual(snapshots[1])
  })
}
