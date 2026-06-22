import { defineNuxtPlugin } from '#imports'
import * as MasterCSSRuntime from '@master/css-runtime'
// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'
// @ts-expect-error virtual module
import emittedGlobals from 'virtual:master-css-emitted-globals'

export default defineNuxtPlugin(() => {
    const initCSSRuntimeAsync = 'initCSSRuntimeAsync' in MasterCSSRuntime
        ? MasterCSSRuntime.initCSSRuntimeAsync as typeof MasterCSSRuntime.initCSSRuntime
        : async (options: Parameters<typeof MasterCSSRuntime.initCSSRuntime>[0]) => MasterCSSRuntime.initCSSRuntime(options)
    void initCSSRuntimeAsync({ manifest, emittedGlobals })
})
