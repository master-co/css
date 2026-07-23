import { defineNuxtPlugin } from '#imports'
import { MasterCSSRuntime } from '@master/css-runtime'
// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'
// @ts-expect-error virtual module
import emittedGlobals from 'virtual:master-css-emitted-globals'

export default defineNuxtPlugin(async () => {
  try {
    const cssRuntime = await MasterCSSRuntime.start({
      manifest,
      emittedGlobals,
      onDiagnostic: diagnostic => console.error(diagnostic)
    })
    cssRuntime.observe()
  } catch {
    // MasterCSSRuntime.start() already reports a structured error and fails open.
  }
})
