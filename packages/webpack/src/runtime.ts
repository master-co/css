/// <reference types="@master/css/client" />

import { MasterCSSRuntime } from '@master/css-runtime'
import masterCSSManifest from 'virtual:master-css-manifest'
import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals'

interface HotModule {
  hot?: {
    accept: (dependencies?: string[] | (() => void), callback?: () => void) => void
    dispose: (callback: () => void) => void
  }
}

declare const module: HotModule | undefined

type RuntimeState = {
  runtime?: MasterCSSRuntime
  generation?: number
}

const state = ((globalThis as typeof globalThis & { __MASTER_CSS_WEBPACK_RUNTIME__?: RuntimeState }).__MASTER_CSS_WEBPACK_RUNTIME__ ??= {})

function destroyRuntime() {
  state.generation = (state.generation || 0) + 1
  state.runtime?.dispose()
  state.runtime = undefined
}

async function startRuntime(
  manifest = masterCSSManifest,
  emittedGlobals = masterCSSEmittedGlobals
) {
  if (typeof document === 'undefined') return
  destroyRuntime()
  const generation = state.generation
  const nextRuntime = await MasterCSSRuntime.start({
    manifest,
    emittedGlobals,
    onDiagnostic: diagnostic => console.error(diagnostic)
  })
  if (generation !== state.generation) {
    nextRuntime.dispose()
    return
  }
  state.runtime = nextRuntime.observe()
}

if (typeof document !== 'undefined') {
  void startRuntime().catch(() => {})
}

if (typeof module !== 'undefined' && module.hot) {
  module.hot.accept(() => {})
  module.hot.accept([
    'virtual:master-css-manifest',
    'virtual:master-css-emitted-globals'
  ], () => {
    void startRuntime().catch(() => {})
  })
  module.hot.dispose(destroyRuntime)
}
