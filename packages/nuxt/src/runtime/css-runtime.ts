import { defineNuxtPlugin } from '#imports'
import { initCSSRuntime } from '@master/css-runtime'
// @ts-expect-error virtual module
import plan from 'virtual:master-css-plan.json'
// @ts-expect-error virtual module
import preloaded from 'virtual:master-css-preloaded'

export default defineNuxtPlugin(() => {
    initCSSRuntime({ plan, preloaded })
})
