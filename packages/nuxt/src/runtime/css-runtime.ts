import { defineNuxtPlugin } from '#imports'
import { initCSSRuntime } from '@master/css-runtime'
// @ts-expect-error virtual module
import config from 'virtual:master-css-config'

export default defineNuxtPlugin(() => {
    initCSSRuntime(config)
})