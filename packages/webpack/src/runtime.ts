/// <reference types="@master/css-integration/client" />

import CSSRuntime from '@master/css-runtime'
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
  runtime?: CSSRuntime
}

const state = ((globalThis as typeof globalThis & { __MASTER_CSS_WEBPACK_RUNTIME__?: RuntimeState }).__MASTER_CSS_WEBPACK_RUNTIME__ ??= {})

function destroyRuntime() {
  state.runtime?.destroy()
  state.runtime = undefined
}

async function startRuntime(
  manifest = masterCSSManifest,
  emittedGlobals = masterCSSEmittedGlobals
) {
  if (typeof document === 'undefined') return
  destroyRuntime()
  const nextRuntime = CSSRuntime.create({
    manifest,
    emittedGlobals
  })
  if (nextRuntime.needsHydrationManifest()) {
    await nextRuntime.loadHydrationManifest()
  }
  state.runtime = nextRuntime.observe()
}

if (typeof document !== 'undefined') {
  void startRuntime()
}

if (typeof module !== 'undefined' && module.hot) {
  module.hot.accept(() => {})
  module.hot.accept([
    'virtual:master-css-manifest',
    'virtual:master-css-emitted-globals'
  ], () => {
    void startRuntime()
  })
  module.hot.dispose(destroyRuntime)
}
