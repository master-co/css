import type { ScannerOptions } from '@master/css-tooling/scanner'

export type Mode = 'runtime' | 'pre-render' | 'static' | 'progressive' | null
export type AdapterOrder = 'master-first' | 'external-first'

export interface Options {
  /**
   * Next.js integration mode.
   * Set to `null` to skip rendering modes while keeping the CSS manifest loaders.
   */
  mode?: Mode
  /**
   * Whether to include Master CSS runtime through the Next client instrumentation hook.
   */
  injectRuntime?: boolean
  /**
   * Scanner options for static rendering mode.
   */
  scannerOptions?: ScannerOptions
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
  adapterOrder?: AdapterOrder
}

export interface ResolvedOptions {
  mode: Mode
  injectRuntime: boolean
  scannerOptions: ScannerOptions
  buildReport: boolean | string
  debug: boolean
  adapterOrder: AdapterOrder
}

declare global {
  var __MASTER_CSS_NEXT_OPTIONS__: Options | undefined
}

export function resolveOptions(options: Options = {}): ResolvedOptions {
  return {
    mode: options.mode === undefined ? 'progressive' : options.mode,
    injectRuntime: options.injectRuntime ?? true,
    scannerOptions: options.scannerOptions ?? {},
    buildReport: options.buildReport ?? false,
    debug: options.debug ?? false,
    adapterOrder: options.adapterOrder ?? 'master-first'
  }
}

export function registerOptions(options: Options) {
  globalThis.__MASTER_CSS_NEXT_OPTIONS__ = options
}

export function getRegisteredOptions() {
  return globalThis.__MASTER_CSS_NEXT_OPTIONS__
}
