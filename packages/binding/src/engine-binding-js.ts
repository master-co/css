import {
  MASTER_CSS_DIAGNOSTIC_VERSION,
  MasterCSSError
} from '@master/css-schema'
import { createEngineSession, EngineError, type EngineSession } from '@master/css-engine-js'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEngineBindingSession, MasterCSSEngineBindingSessionOptions } from './engine-binding'
import { bindEngineBindingSession } from './engine-binding-adapter'
import type {
  MasterCSSEngineExecutionState,
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition
} from './protocol'

// Sessions of the JavaScript engine, which executes compiled programs where Node is
// absent: in browsers through the browser entry, and through the default entry when
// a bundler or host resolves that one instead.

/** The JavaScript engine executes compiled programs; compiling a manifest is a Node build step. */
export function programRequired(): never {
  throw new MasterCSSError({
    code: 'INVALID_INPUT',
    domain: 'binding',
    message: 'Master CSS engines in browsers execute compiled runtime programs, not manifests. '
      + 'Compile the manifest with compileRuntimeProgram() from @master/css/node and pass { program }.'
  })
}

function program(source: MasterCSSManifest | Uint8Array | undefined) {
  return ArrayBuffer.isView(source) ? source : programRequired()
}

function invalidEmittedGlobals(message: string): never {
  throw new MasterCSSError({
    code: 'INVALID_INPUT',
    domain: 'binding',
    message: `Invalid Master CSS emitted globals: ${message}`
  })
}

const EMITTED_GLOBALS_FIELDS = new Set(['variables', 'keyframes', 'keyframeSlots', 'suppressedKeyframes'])

/** Accepts what the engine's emitted globals schema accepts, as the Wasm engine binding does. */
function emittedGlobals(globals: MasterCSSEmittedGlobals | undefined) {
  if (globals === undefined) return
  for (const field of Object.keys(globals)) {
    if (!EMITTED_GLOBALS_FIELDS.has(field)) invalidEmittedGlobals(`unknown field ${field}.`)
  }
  for (const field of ['variables', 'keyframes'] as const) {
    for (const [name, count] of Object.entries(globals[field] ?? {})) {
      if (!Number.isInteger(count) || count < 0 || count > 0xffffffff) invalidEmittedGlobals(`${field}.${name} must be a count.`)
    }
  }
  return globals
}

/** Engine errors carry their diagnostic, as the Wasm engine reports them. */
function engineError(cause: unknown) {
  if (!(cause instanceof EngineError)) return cause
  const diagnostic = { version: MASTER_CSS_DIAGNOSTIC_VERSION, code: cause.code, domain: 'engine' as const, severity: 'error' as const, message: cause.message }
  return new MasterCSSError({ code: cause.code, domain: 'engine', message: cause.message, diagnostics: [diagnostic] }, { cause })
}

function call<T>(operation: () => T): T {
  try {
    return operation()
  } catch (cause) {
    throw engineError(cause)
  }
}

function bindSession(session: EngineSession) {
  const dispose = () => session.dispose()
  return bindEngineBindingSession('js', {
    ensureClassRules: (classNames) => call(() => session.ensureClassRules(classNames)) as unknown as MasterCSSEngineTransition,
    deleteClassRules: (classNames) => call(() => session.deleteClassRules(classNames)) as unknown as MasterCSSEngineTransition,
    registerEmittedGlobals: (globals) => call(() => session.registerEmittedGlobals(emittedGlobals(globals)!)) as unknown as MasterCSSEngineTransition,
    replaceEmittedGlobals: (globals) => call(() => session.replaceEmittedGlobals(emittedGlobals(globals)!)) as unknown as MasterCSSEngineTransition,
    refresh: (source, globals) => call(() => session.refresh(program(source), emittedGlobals(globals))) as unknown as MasterCSSEngineTransition,
    keyframeDefinitions: () => call(() => session.keyframeDefinitions()) as never,
    executionState: (classNames) => call(() => session.executionState(classNames)) as unknown as MasterCSSEngineExecutionState,
    inspect: () => {
      throw new MasterCSSError({
        code: 'FEATURE_UNAVAILABLE',
        domain: 'engine',
        message: 'Master CSS class inspection is unavailable in the JavaScript engine; use @master/css/node.'
      })
    },
    snapshot: () => call(() => session.snapshot()) as unknown as MasterCSSEngineSnapshot,
    dispose,
    [Symbol.dispose]: dispose
  })
}

export function createJavaScriptEngineBindingSession(options: MasterCSSEngineBindingSessionOptions): MasterCSSEngineBindingSession {
  const source = program(options.program ?? options.manifest)
  return bindSession(call(() => createEngineSession(source, emittedGlobals(options.emittedGlobals))))
}
