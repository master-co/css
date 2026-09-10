/// <reference types="@master/css/client" />
/// <reference types="webpack/module" />

import { MasterCSSRuntime } from '@master/css-runtime'
import masterCSSManifest from 'virtual:master-css-manifest'
import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals'

type RuntimeState = {
  runtime?: MasterCSSRuntime
  generation?: number
  pendingStart?: Promise<void>
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
  const startup = (state.pendingStart ?? Promise.resolve()).catch(() => {}).then(async () => {
    if (generation !== state.generation) return
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
  })
  state.pendingStart = startup
  await startup
}

if (typeof document !== 'undefined') {
  void startRuntime().catch(() => {})
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(() => {})
  import.meta.webpackHot.accept([
    'virtual:master-css-manifest',
    'virtual:master-css-emitted-globals'
  ], () => {
    void startRuntime().catch(() => {})
  })
  import.meta.webpackHot.dispose(destroyRuntime)
}
