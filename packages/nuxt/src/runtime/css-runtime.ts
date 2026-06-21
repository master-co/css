import { defineNuxtPlugin } from '#imports'
import { initCSSRuntime } from '@master/css-runtime'
// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'
// @ts-expect-error virtual module
import emittedGlobals from 'virtual:master-css-emitted-globals'

export default defineNuxtPlugin(() => {
    initCSSRuntime({ manifest, emittedGlobals })
})
