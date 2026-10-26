import type {
  EmittedGlobals,
  EngineSession,
  ExecutionState,
  KeyframeDefinition,
  Snapshot,
  Transition
} from './types'

export class EngineError extends Error {
  constructor(readonly code: 'SESSION_DISPOSED' | 'INVALID_PROGRAM', message: string) {
    super(message)
  }
}

const EMPTY_TRANSITION: Transition = Object.freeze({ version: 0, mutations: Object.freeze([]) })

// J0 skeleton: every operation returns an empty result so the differential harness
// can run end to end and report each divergence from the Rust engine.
export function createEngineSession(program: Uint8Array, emittedGlobals?: EmittedGlobals): EngineSession {
  void program
  void emittedGlobals
  let disposed = false
  const assertActive = () => {
    if (disposed) throw new EngineError('SESSION_DISPOSED', 'The Master CSS engine session has been disposed.')
  }
  return Object.freeze({
    ensureClassRules(classNames: readonly string[]): Transition {
      assertActive()
      void classNames
      return EMPTY_TRANSITION
    },
    deleteClassRules(classNames: readonly string[]): Transition {
      assertActive()
      void classNames
      return EMPTY_TRANSITION
    },
    registerEmittedGlobals(next: EmittedGlobals): Transition {
      assertActive()
      void next
      return EMPTY_TRANSITION
    },
    replaceEmittedGlobals(next: EmittedGlobals): Transition {
      assertActive()
      void next
      return EMPTY_TRANSITION
    },
    refresh(next: Uint8Array, nextGlobals?: EmittedGlobals): Transition {
      assertActive()
      void next
      void nextGlobals
      return EMPTY_TRANSITION
    },
    keyframeDefinitions(): readonly KeyframeDefinition[] {
      assertActive()
      return []
    },
    executionState(classNames: readonly string[]): ExecutionState {
      assertActive()
      void classNames
      return { classes: [], resources: {} }
    },
    snapshot(): Snapshot {
      assertActive()
      return { version: 0, rules: [], resources: {}, text: '' }
    },
    dispose() {
      disposed = true
    }
  })
}
