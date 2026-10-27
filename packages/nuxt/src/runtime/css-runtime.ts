import { defineNuxtPlugin } from '#imports'
// @ts-expect-error virtual module
import program from 'virtual:master-css-program'
import { startMasterCSSRuntime } from './start-css-runtime'

export default defineNuxtPlugin(() => startMasterCSSRuntime(program))
