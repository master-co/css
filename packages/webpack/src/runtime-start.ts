/// <reference types="webpack/module" />

import {
  MasterCSSRuntime,
  type MasterCSSRuntimeProgram,
  type MasterCSSRuntimeProgramLoader
} from '@master/css-runtime'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'

type RuntimeState = {
  runtime?: MasterCSSRuntime
  generation?: number
  pendingStart?: Promise<void>
}

const state = ((globalThis as typeof globalThis & { __MASTER_CSS_WEBPACK_RUNTIME__?: RuntimeState }).__MASTER_CSS_WEBPACK_RUNTIME__ ??= {})

export function destroyRuntime() {
  state.generation = (state.generation || 0) + 1
  state.runtime?.dispose()
  state.runtime = undefined
}

/**
 * Starts the runtime once, then refreshes it on HMR. A program loader runs only
 * when the engine starts; refreshing with one means only emitted globals changed.
 */
export async function startRuntime(
  program: MasterCSSRuntimeProgram | MasterCSSRuntimeProgramLoader,
  emittedGlobals: MasterCSSEmittedGlobals
) {
  if (typeof document === 'undefined') return
  if (state.runtime) {
    state.runtime.refresh(typeof program === 'function' ? undefined : program, emittedGlobals)
    return
  }
  destroyRuntime()
  const generation = state.generation
  const startup = (state.pendingStart ?? Promise.resolve()).catch(() => {}).then(async () => {
    if (generation !== state.generation) return
    const nextRuntime = await MasterCSSRuntime.start({
      program,
      emittedGlobals,
      stylesheetDelivery: { base: __webpack_public_path__ || '/', development: process.env.NODE_ENV === 'development' },
      onDiagnostic: diagnostic => console.error(diagnostic)
    })
    if (generation !== state.generation) {
      nextRuntime.dispose()
      return
    }
    state.runtime = nextRuntime.observe()
  })
  state.pendingStart = startup
  await startup
}
