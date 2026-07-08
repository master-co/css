import { defineNuxtPlugin } from '#imports'
import CSSRuntime from '@master/css-runtime'
// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'
// @ts-expect-error virtual module
import emittedGlobals from 'virtual:master-css-emitted-globals'

export default defineNuxtPlugin(() => {
  const cssRuntime = CSSRuntime.create({ manifest, emittedGlobals })
  if (cssRuntime.needsHydrationManifest()) {
    void cssRuntime.loadHydrationManifest().then(() => cssRuntime.observe())
  } else {
    cssRuntime.observe()
  }
})
