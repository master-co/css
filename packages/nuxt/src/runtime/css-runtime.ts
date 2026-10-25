import { defineNuxtPlugin } from '#imports'
// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'
import { startMasterCSSRuntime } from './start-css-runtime'

export default defineNuxtPlugin(() => startMasterCSSRuntime(manifest))
