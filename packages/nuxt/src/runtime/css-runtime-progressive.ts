import { defineNuxtPlugin } from '#imports'
import { startMasterCSSRuntime } from './start-css-runtime'

// Pre-rendered pages defer the engine, so the project manifest loads only if it starts.
export default defineNuxtPlugin(() => startMasterCSSRuntime(async () => {
  // @ts-expect-error virtual module
  return (await import('virtual:master-css-manifest')).default
}))
