import log from './log'
import type CSSRuntime from '../core'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { HydrateResult } from '../types'

export function debugRuntimeCreated(cssRuntime: CSSRuntime) {
    log.debug('created', cssRuntime)
}

export function debugRuntimeHydrated(cssRuntime: CSSRuntime, result: HydrateResult) {
    log.debug('hydrated', cssRuntime, result)
}

export function debugRuntimeObserved(cssRuntime: CSSRuntime) {
    log.debug('observed', cssRuntime)
    if (cssRuntime.progressive) {
        log.info('Progressive rendering is adopted.')
        log.debug('pre-rendered CSS', cssRuntime.style)
    } else {
        log.info('Runtime rendering is adopted.')
    }
}

export function debugRuntimeRefreshed(cssRuntime: CSSRuntime, manifest: MasterCSSManifest) {
    log.debug('refreshed', cssRuntime, manifest)
}

export function debugRuntimeDisconnected(cssRuntime: CSSRuntime) {
    log.debug('disconnected', cssRuntime)
}

export function debugRuntimeDestroyed(cssRuntime: CSSRuntime) {
    log.debug('destroyed', cssRuntime)
}
