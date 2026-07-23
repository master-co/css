import type {
  MasterCSSIntegrationRuntimeOptions,
  MasterCSSRenderingMode
} from '@master/css-schema/integration'
import type { MasterCSSScannerConfiguration } from '@master/css-tooling/scanner/node'

export type MasterCSSNextAdapterOrder = 'master-first' | 'external-first'

export interface MasterCSSNextOptions {
  enabled?: boolean
  mode?: MasterCSSRenderingMode
  runtime?: boolean | MasterCSSIntegrationRuntimeOptions
  scanner?: MasterCSSScannerConfiguration
  /**
   * Write a build report with rendered files.
   * `true` writes `.next/master-css-build-report.json`; a string is resolved from `distDir`.
   */
  buildReport?: boolean | string
  /**
   * Log rendered output details during `next build`.
   */
  debug?: boolean
  /**
   * Adapter execution order when composing with another Next adapter.
   */
  adapterOrder?: MasterCSSNextAdapterOrder
}

export interface ResolvedMasterCSSNextOptions {
  enabled: boolean
  mode: MasterCSSRenderingMode
  runtime: MasterCSSIntegrationRuntimeOptions
  injectRuntime: boolean
  scanner: MasterCSSScannerConfiguration
  buildReport: boolean | string
  debug: boolean
  adapterOrder: MasterCSSNextAdapterOrder
}

declare global {
  var __MASTER_CSS_NEXT_OPTIONS__: MasterCSSNextOptions | undefined
}

export function resolveOptions(options: MasterCSSNextOptions = {}): ResolvedMasterCSSNextOptions {
  const runtime = typeof options.runtime === 'object'
    ? options.runtime
    : { enabled: options.runtime }
  return {
    enabled: options.enabled ?? true,
    mode: options.mode ?? 'progressive',
    runtime,
    injectRuntime: runtime.enabled ?? true,
    scanner: options.scanner ?? {},
    buildReport: options.buildReport ?? false,
    debug: options.debug ?? false,
    adapterOrder: options.adapterOrder ?? 'master-first'
  }
}

export function registerOptions(options: MasterCSSNextOptions) {
  globalThis.__MASTER_CSS_NEXT_OPTIONS__ = options
}

export function getRegisteredOptions() {
  return globalThis.__MASTER_CSS_NEXT_OPTIONS__
}
