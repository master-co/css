import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { MasterCSSRuntime } from '@master/css-runtime'
// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'
// @ts-expect-error virtual module
import emittedGlobals from 'virtual:master-css-emitted-globals'

export default defineNuxtPlugin(async () => {
  try {
    const { app } = useRuntimeConfig()
    const cssRuntime = await MasterCSSRuntime.start({
      manifest,
      emittedGlobals,
      stylesheetDelivery: { base: app.cdnURL || app.baseURL, development: process.env.NODE_ENV === 'development' },
      onDiagnostic: diagnostic => console.error(diagnostic)
    })
    cssRuntime.observe()
  } catch {
    // MasterCSSRuntime.start() already reports a structured error and fails open.
  }
})
