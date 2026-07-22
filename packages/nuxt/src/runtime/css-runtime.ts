import { defineNuxtPlugin } from '#imports'
import CSSRuntime from '@master/css-runtime'
// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'
// @ts-expect-error virtual module
import emittedGlobals from 'virtual:master-css-emitted-globals'

export default defineNuxtPlugin(async () => {
  try {
    const cssRuntime = await CSSRuntime.start({
      manifest,
      emittedGlobals,
      onError: diagnostic => console.error(diagnostic)
    })
    cssRuntime.observe()
  } catch {
    // CSSRuntime.start() already reports a structured error and fails open.
  }
})
