import { defineNuxtPlugin } from '#imports'
import { initCSSRuntime } from '@master/css-runtime'
// @ts-expect-error virtual module
import config from 'virtual:master-css-config'
// @ts-expect-error virtual module
import preloaded from 'virtual:master-css-preloaded'

export default defineNuxtPlugin(() => {
    initCSSRuntime({ config, preloaded })
})
