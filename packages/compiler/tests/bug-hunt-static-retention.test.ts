import { expect, test } from 'vitest'
import { createEngine } from '@master/css'
import { compileRenderedStylesheet } from '../src/stylesheet'
import { readFileSync } from 'node:fs'

const cases = JSON.parse(readFileSync(new URL('./bug-hunt-static-retention.json', import.meta.url), 'utf8')) as { id: string, css: string, names: string[], nativeNames?: string[] }[]

for (const entry of cases) {
  test(`BH-0003: ${entry.id} scoped dependency graph survives public compile and class lifetimes`, async () => {
    const compiled = await compileRenderedStylesheet('/static.css', entry.css + ".native{color:var(--color-brand)}", { baseManifest: {
  mixins: [
  {
    "name": "--all",
    "body": [
      {
        "type": "condition" as const,
        "condition": "@media all",
        "body": [
          {
            "type": "contents" as const,
            "fallback": []
          }
        ]
      }
    ]
  }
],
  "version": 4 as const,
  "languageVersion": 12 as const
} })
    const snapshots = []
    for (const binding of ['native', 'wasm'] as const) {
      const engine = await createEngine({ manifest: compiled.manifest, binding })
      try {
        const initial = engine.snapshot()
        expect(initial.resources.variables).toEqual([])
        expect(initial.text).toBe('')
        engine.ensureClassRules(['color:var(--color-brand)'])
        const live = engine.snapshot()
        expect(live.resources.variables.map(variable => variable.name).sort()).toEqual(entry.names)
        for (const name of [...entry.names, ...entry.nativeNames ?? []]) expect(compiled.generatedCSS).toContain(`--${name}:`)
        engine.deleteClassRules(['color:var(--color-brand)'])
        expect(engine.snapshot()).toEqual(initial)
        snapshots.push(live)
      } finally { engine.dispose() }
    }
    expect(snapshots[0]).toEqual(snapshots[1])
  })
}
