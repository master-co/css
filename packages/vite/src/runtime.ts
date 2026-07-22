/// <reference types="@master/css-integration/client" />
/// <reference types="vite/client" />

import CSSRuntime from '@master/css-runtime'
import masterCSSManifest from 'virtual:master-css-manifest'
import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals'

type RuntimeManifestModule = { default: typeof masterCSSManifest }
type RuntimeEmittedGlobalsModule = { default: typeof masterCSSEmittedGlobals }

let masterCSSRuntime: CSSRuntime | undefined
let startGeneration = 0

function destroyRuntime() {
  startGeneration++
  masterCSSRuntime?.destroy()
  masterCSSRuntime = undefined
}

async function startRuntime(
  manifest = masterCSSManifest,
  emittedGlobals = masterCSSEmittedGlobals
) {
  if (typeof document === 'undefined') return
  destroyRuntime()
  const generation = startGeneration
  const nextRuntime = await CSSRuntime.start({
    manifest,
    emittedGlobals,
    onError: diagnostic => console.error(diagnostic)
  })
  if (generation !== startGeneration) {
    nextRuntime.destroy()
    return
  }
  masterCSSRuntime = nextRuntime.observe()
}

if (typeof document !== 'undefined') {
  void startRuntime().catch(() => {})
}

if (import.meta.hot) {
  import.meta.hot.accept(() => {})
  import.meta.hot.accept([
    'virtual:master-css-manifest',
    'virtual:master-css-emitted-globals'
  ], (modules) => {
    const [manifestModule, emittedGlobalsModule] = modules as [
      RuntimeManifestModule | undefined,
      RuntimeEmittedGlobalsModule | undefined
    ]
    void startRuntime(
      manifestModule?.default ?? masterCSSManifest,
      emittedGlobalsModule?.default ?? masterCSSEmittedGlobals
    ).catch(() => {})
  })
  import.meta.hot.dispose(destroyRuntime)
}
