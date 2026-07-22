import { afterAll, bench, describe } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import UtilityType from '@master/css-schema/utility-type'
import { createEngineSync } from '../src/node'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const runtimeClassNames = [
  'block',
  'text:center',
  'bg:red-60',
  'fg:primary',
  'm:4x',
  'pb:8x:not(:last)',
  'w:calc(var(--h)|/|var(--w)*100%)',
  'grid-cols:3',
  'hidden@sm',
  'b:1px|solid|line',
  'font:.75rem',
  'round',
  'fixed',
  'animation:fade|1s',
  'translate:-md',
  'bg:linear-gradient(current,black)',
  'flex@sm'
]

const benchOptions = { time: 500, warmupTime: 100 }
let sink = 0

function createPatternBenchmarkManifest(separator: '-' | '_'): MasterCSSManifest {
  return {
    version: 1,
    settings: { modes: [] },
    utilities: Array.from({ length: 100 }, (_, index) => ({
      id: `icon-${index}<left|right>`,
      name: `icon-${index}<left|right>`,
      type: UtilityType.Semantic,
      order: index,
      emit: {
        type: 'static',
        rules: [{ declarations: { 'grid-area': null } }]
      },
      matchers: [{
        type: 'pattern',
        prefix: `icon-${index}${separator}`,
        values: ['left', 'right']
      }]
    }))
  }
}

describe('Rust engine session hot paths', () => {
  const engine = createEngineSync({ manifest: defaultManifest })
  const indexed = createEngineSync({ manifest: createPatternBenchmarkManifest('-') })
  const fallback = createEngineSync({ manifest: createPatternBenchmarkManifest('_') })
  const indexedClassNames = Array.from({ length: 100 }, (_, index) => `icon-${index}-left`)
  const fallbackClassNames = Array.from({ length: 100 }, (_, index) => `icon-${index}_left`)

  afterAll(() => {
    engine.dispose()
    indexed.dispose()
    fallback.dispose()
  })

  bench('batch ensure and delete representative runtime classes', () => {
    sink = engine.ensureClassRules(runtimeClassNames).added.length
    sink += engine.snapshot().text.length
    sink += engine.deleteClassRules(runtimeClassNames).removed.length
  }, benchOptions)

  bench('inspect representative runtime classes', () => {
    let total = 0
    for (let index = 0; index < 1_000; index++) {
      total += engine.inspect(runtimeClassNames[index % runtimeClassNames.length]).rules.length
    }
    sink = total
  }, benchOptions)

  bench('create native sessions from the default manifest', () => {
    let total = 0
    for (let index = 0; index < 100; index++) {
      const session = createEngineSync({ manifest: defaultManifest })
      total += session.snapshot().rules.length
      session.dispose()
    }
    sink = total
  }, benchOptions)

  bench('match indexed pattern utilities in one FFI batch', () => {
    sink = indexed.ensureClassRules(indexedClassNames).added.length
    indexed.deleteClassRules(indexedClassNames)
  }, benchOptions)

  bench('match fallback pattern utilities in one FFI batch', () => {
    sink = fallback.ensureClassRules(fallbackClassNames).added.length
    fallback.deleteClassRules(fallbackClassNames)
  }, benchOptions)
})

void sink
