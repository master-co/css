import { describe, expect, it } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifest from '../../preset/src/default-manifest.json'
import {
  compileRuntimeProgram as compileNodeRuntimeProgram,
  createEngineBindingSession as createNodeEngineBindingSession
} from '../src/engine-binding'
import {
  compileRuntimeProgram,
  createEngineBindingSession,
  createRenderBindingSession
} from '../src/engine-binding-browser'

const manifest = defaultManifest as unknown as MasterCSSManifest
const program = await compileNodeRuntimeProgram(manifest, { binding: 'wasm' })

describe('browser engine binding', () => {
  it('executes compiled programs with the JavaScript engine as the Wasm engine does', async () => {
    const emittedGlobals = { variables: { 'color-red-60': 1 } }
    const browser = await createEngineBindingSession({ program, emittedGlobals })
    const node = await createNodeEngineBindingSession({ program, emittedGlobals }, { binding: 'wasm' })
    try {
      expect(browser.binding).toBe('js')
      const classes = ['fg-red-60', 'p-md:hover@sm', 'animate-fade', 'grid-cols(3)', 'color:red!']
      expect(browser.ensureClassRules(classes)).toEqual(node.ensureClassRules(classes))
      expect(browser.executionState(classes)).toEqual(node.executionState(classes))
      expect(browser.registerEmittedGlobals({ keyframes: { fade: 1 } })).toEqual(node.registerEmittedGlobals({ keyframes: { fade: 1 } }))
      expect(browser.refresh(program, {})).toEqual(node.refresh(program, {}))
      expect(browser.deleteClassRules(classes.slice(1))).toEqual(node.deleteClassRules(classes.slice(1)))
      expect(browser.snapshot()).toEqual(node.snapshot())
      expect(browser.keyframeDefinitions()).toEqual(node.keyframeDefinitions())
    } finally {
      browser.dispose()
      node.dispose()
    }
  })

  it('reports engine errors with their diagnostic', async () => {
    await expect(createEngineBindingSession({ program: new Uint8Array([1, 2, 3]) })).rejects.toMatchObject({
      code: 'INVALID_PROGRAM',
      domain: 'engine',
      diagnostics: [expect.objectContaining({ code: 'INVALID_PROGRAM', domain: 'engine', severity: 'error' })]
    })
    const session = await createEngineBindingSession({ program })
    expect(() => session.replaceEmittedGlobals({ variables: { x: -1 } })).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }))
    expect(() => session.registerEmittedGlobals({ animations: {} } as never)).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }))
    session.dispose()
    expect(() => session.snapshot()).toThrowError(expect.objectContaining({ code: 'SESSION_DISPOSED' }))
  })

  it('executes programs with the JavaScript engine from the default entry without Node', async () => {
    const { process } = globalThis
    Object.defineProperty(globalThis, 'process', { value: undefined, configurable: true, writable: true })
    let starting: ReturnType<typeof createNodeEngineBindingSession>
    try {
      // The entry decides before its first await, while Node is hidden.
      starting = createNodeEngineBindingSession({ program })
    } finally {
      Object.defineProperty(globalThis, 'process', { value: process, configurable: true, writable: true })
    }
    const session = await starting
    try {
      expect(session.binding).toBe('js')
      expect(session.ensureClassRules(['fg-red-60']).mutations).not.toHaveLength(0)
    } finally {
      session.dispose()
    }
  })

  it('leaves native and Wasm engines, manifests, inspection and rendering to Node', async () => {
    await expect(createEngineBindingSession({ program }, { binding: 'native' })).rejects.toMatchObject({ code: 'NATIVE_UNAVAILABLE' })
    await expect(createEngineBindingSession({ program }, { binding: 'wasm' })).rejects.toMatchObject({ code: 'WASM_UNAVAILABLE' })
    await expect(createEngineBindingSession({ manifest })).rejects.toMatchObject({ code: 'INVALID_INPUT' })
    await expect(compileRuntimeProgram(manifest)).rejects.toMatchObject({ code: 'INVALID_INPUT' })
    await expect(createRenderBindingSession({ manifest })).rejects.toMatchObject({ code: 'FEATURE_UNAVAILABLE', domain: 'server' })
    const session = await createEngineBindingSession({ program })
    expect(() => session.inspect('block')).toThrowError(expect.objectContaining({ code: 'FEATURE_UNAVAILABLE' }))
    expect(() => session.refresh(manifest)).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }))
    session.dispose()
  })
})
