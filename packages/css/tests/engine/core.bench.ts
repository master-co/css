import { afterAll, test, describe } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createEngineSync } from '../../src/node'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const runtimeClassNames = [
  "display:block",
  'text-align:center',
  'bg-red-60',
  'fg-blue',
  "margin:1rem",
  "padding-bottom:2rem:not(:last)",
  "width:calc(var(--h)|/|var(--w)*100%)",
  "grid-cols(3)",
  "display:none@sm",
  'border:1px|solid|var(--color-line-divider)',
  'font-size:.75rem',
  'round',
  "position:fixed",
  'animation:fade|1s',
  '-translate-md',
  'background-image:linear-gradient(currentColor,oklch(0%|0|none))',
  "display:flex@sm"
]

// Use time budgets even when one iteration creates 100 native sessions.
const benchOptions = { time: 500, warmupTime: 100, iterations: 1, warmupIterations: 1 }
let sink = 0

function createFixedBenchmarkManifest(separator: '-' | '_'): MasterCSSManifest {
  return {
    version: 3,
    languageVersion: 5,
    mixins: Array.from({ length: 100 }, (_, index) => ['left', 'right'].map(value => ({
      name: `--icon-${index}${separator}${value}`,
      body: [{ type: 'declaration' as const, property: 'grid-area', value: [{ type: 'text' as const, value }] }]
    }))).flat()
  }
}

describe('Rust engine session hot paths', () => {
  const engine = createEngineSync({ manifest: defaultManifest })
  const indexed = createEngineSync({ manifest: createFixedBenchmarkManifest('-') })
  const fallback = createEngineSync({ manifest: createFixedBenchmarkManifest('_') })
  const indexedClassNames = Array.from({ length: 100 }, (_, index) => `icon-${index}-left`)
  const fallbackClassNames = Array.from({ length: 100 }, (_, index) => `icon-${index}_left`)

  afterAll(() => {
    engine.dispose()
    indexed.dispose()
    fallback.dispose()
  })

  test('batch ensure and delete representative runtime classes', async ({ bench }) => {
    await bench('batch ensure and delete representative runtime classes', () => {
      sink = engine.ensureClassRules(runtimeClassNames).mutations.length
      sink += engine.snapshot().text.length
      sink += engine.deleteClassRules(runtimeClassNames).mutations.length
    }).run(benchOptions)
  })

  test('inspect representative runtime classes', async ({ bench }) => {
    await bench('inspect representative runtime classes', () => {
      let total = 0
      for (let index = 0; index < 1_000; index++) {
        total += engine.inspect(runtimeClassNames[index % runtimeClassNames.length]).rules.length
      }
      sink = total
    }).run(benchOptions)
  })

  test('create native sessions from the default manifest', async ({ bench }) => {
    await bench('create native sessions from the default manifest', () => {
      let total = 0
      for (let index = 0; index < 100; index++) {
        const session = createEngineSync({ manifest: defaultManifest })
        total += session.snapshot().rules.length
        session.dispose()
      }
      sink = total
    }).run(benchOptions)
  })

  test('match hyphenated fixed utilities in one FFI batch', async ({ bench }) => {
    await bench('match hyphenated fixed utilities in one FFI batch', () => {
      sink = indexed.ensureClassRules(indexedClassNames).mutations.length
      indexed.deleteClassRules(indexedClassNames)
    }).run(benchOptions)
  })

  test('match underscore fixed utilities in one FFI batch', async ({ bench }) => {
    await bench('match underscore fixed utilities in one FFI batch', () => {
      sink = fallback.ensureClassRules(fallbackClassNames).mutations.length
      fallback.deleteClassRules(fallbackClassNames)
    }).run(benchOptions)
  })
})

void sink
