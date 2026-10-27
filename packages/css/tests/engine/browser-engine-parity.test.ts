import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { compileRuntimeProgram, createEngineBindingSession } from '@master/css-binding/engine'
import { createEngineBindingSession as createBrowserEngineBindingSession } from '../../../binding/src/engine-binding-browser'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import defaultManifest from '@master/css-preset/default-manifest.json'

// Browsers execute compiled programs with the JavaScript engine of the binding's browser
// entry, while Node runs the Rust engine. Run the corpus through the browser entry,
// executing the program compiled from each manifest against native manifest sessions.
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
beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = fileURLToPath(
    new URL('../../../binding/artifacts/mastercss.node', import.meta.url)
  )
})

const originalCSS = Object.getOwnPropertyDescriptor(globalThis, 'CSS')
afterEach(() => {
  if (originalCSS) Object.defineProperty(globalThis, 'CSS', originalCSS)
  else delete (globalThis as { CSS?: unknown }).CSS
})

describe('browser JavaScript engine', () => {
  it('executes programs without inspection or manifest compilation', async () => {
    const manifest = defaultManifest as unknown as MasterCSSManifest
    const browser = await createBrowserEngineBindingSession({
      program: await compileRuntimeProgram(manifest, { binding: 'native' })
    })
    try {
      expect(browser.binding).toBe('js')
      expect(() => browser.inspect('block')).toThrowError(expect.objectContaining({
        code: 'FEATURE_UNAVAILABLE'
      }))
    } finally {
      browser.dispose()
    }
    await expect(createBrowserEngineBindingSession({ manifest })).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })

  for (const parityCase of corpus.engineCases) {
    it(`matches native sessions for corpus case ${parityCase.id}`, async () => {
      Object.defineProperty(globalThis, 'CSS', {
        configurable: true,
        value: { supports: () => true }
      })
      const manifest = parityCase.manifest === 'default'
        ? defaultManifest as unknown as MasterCSSManifest
        : parityCase.manifest
      const { emittedGlobals } = parityCase
      const native = await createEngineBindingSession({ manifest, emittedGlobals }, { binding: 'native' })
      const runtime = await createBrowserEngineBindingSession({
        program: await compileRuntimeProgram(manifest, { binding: 'native' }),
        emittedGlobals
      })
      try {
        expect(runtime.snapshot(), `${parityCase.id}: initial snapshot`).toEqual(native.snapshot())
        for (const step of parityCase.steps) {
          // Browsers have no inspection; it throws FEATURE_UNAVAILABLE there.
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
