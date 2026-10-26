import log from './log'
import type { MasterCSSRuntime } from '../core'
import type { HydrateResult } from '../types/hydrate-result'

export function debugRuntimeCreated(cssRuntime: MasterCSSRuntime) {
  log.debug('created', cssRuntime)
}

export function debugRuntimeHydrated(cssRuntime: MasterCSSRuntime, result: HydrateResult) {
  log.debug('hydrated', cssRuntime, result)
}

export function debugRuntimeObserved(cssRuntime: MasterCSSRuntime) {
  log.debug('observed', cssRuntime)
  if (cssRuntime.snapshot().hydration.state === 'progressive') {
    log.info('Progressive rendering is adopted.')
    log.debug('pre-rendered CSS', cssRuntime.snapshot().cssText)
  } else {
    log.info('Runtime rendering is adopted.')
  }
}

export function debugRuntimeRefreshed(cssRuntime: MasterCSSRuntime, program: Uint8Array) {
  log.debug('refreshed', cssRuntime, program)
}

export function debugRuntimeDisconnected(cssRuntime: MasterCSSRuntime) {
  log.debug('disconnected', cssRuntime)
}

export function debugRuntimeDestroyed(cssRuntime: MasterCSSRuntime) {
  log.debug('destroyed', cssRuntime)
}
