import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createEngineBindingSession } from '@master/css-binding/engine'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import defaultManifest from '@master/css-preset/default-manifest.json'

// Browsers load the engine Wasm built without the binding's `full` feature, while Node
// tests otherwise exercise the full build. Run the corpus through that runtime build.
type EngineParityStep =
  | { op: 'ensure', classes: string[] }
  | { op: 'delete', classes: string[] }
  | { op: 'inspect', className: string }
  | { op: 'inspectContains', className: string }

interface EngineParityCase {
  id: string
  manifest: 'default' | MasterCSSManifest
  emittedGlobals?: MasterCSSEmittedGlobals
  steps: EngineParityStep[]
}

const corpus = JSON.parse(readFileSync(
  new URL('../../../../parity/v2-language-corpus.json', import.meta.url),
  'utf8'
)) as { engineCases: EngineParityCase[] }
const runtimeArtifacts = new URL('../../../binding-wasm-engine/artifacts/runtime/', import.meta.url)

let runtimeWasm: { module: object, input: Uint8Array }

beforeAll(async () => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = fileURLToPath(
    new URL('../../../binding/artifacts/mastercss.node', import.meta.url)
  )
  runtimeWasm = {
    module: await import(new URL('mastercss_binding_wasm_engine.js', runtimeArtifacts).href) as object,
    input: new Uint8Array(await readFile(new URL('mastercss_binding_wasm_engine_bg.wasm', runtimeArtifacts)))
  }
})

const originalCSS = Object.getOwnPropertyDescriptor(globalThis, 'CSS')
afterEach(() => {
  if (originalCSS) Object.defineProperty(globalThis, 'CSS', originalCSS)
  else delete (globalThis as { CSS?: unknown }).CSS
})

describe('runtime engine Wasm artifact', () => {
  it('runs without the full feature', async () => {
    const runtime = await createEngineBindingSession({
      manifest: defaultManifest as unknown as MasterCSSManifest
    }, { binding: 'wasm', wasm: runtimeWasm })
    try {
      expect(() => runtime.inspect('block')).toThrowError(expect.objectContaining({
        code: 'WASM_FEATURE_UNAVAILABLE'
      }))
    } finally {
      runtime.dispose()
    }
  })

  for (const parityCase of corpus.engineCases) {
    it(`matches native sessions for corpus case ${parityCase.id}`, async () => {
      Object.defineProperty(globalThis, 'CSS', {
        configurable: true,
        value: { supports: () => true }
      })
      const options = {
        manifest: parityCase.manifest === 'default'
          ? defaultManifest as unknown as MasterCSSManifest
          : parityCase.manifest,
        emittedGlobals: parityCase.emittedGlobals
      }
      const native = await createEngineBindingSession(options, { binding: 'native' })
      const runtime = await createEngineBindingSession(options, { binding: 'wasm', wasm: runtimeWasm })
      try {
        expect(runtime.snapshot(), `${parityCase.id}: initial snapshot`).toEqual(native.snapshot())
        for (const step of parityCase.steps) {
          // Inspection exists only in the full build; the runtime throws WASM_FEATURE_UNAVAILABLE.
          if (step.op !== 'ensure' && step.op !== 'delete') continue
          const label = `${parityCase.id}: ${step.op} ${step.classes.join(' ')}`
          const method = step.op === 'ensure' ? 'ensureClassRules' : 'deleteClassRules'
          expect(runtime[method](step.classes), `${label} transition`).toEqual(native[method](step.classes))
          expect(runtime.executionState(step.classes), `${label} execution state`)
            .toEqual(native.executionState(step.classes))
          expect(runtime.snapshot(), `${label} snapshot`).toEqual(native.snapshot())
        }
      } finally {
        native.dispose()
        runtime.dispose()
      }
    })
  }
})
