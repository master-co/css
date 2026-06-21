import type { Options as ExtractorOptions } from '@master/css-extractor'

export type Mode = 'pre-render' | 'static' | null
export type AdapterOrder = 'master-first' | 'external-first'

export interface Options {
    /**
     * Next.js integration mode.
     * Set to `null` to skip rendering modes while keeping the CSS manifest loaders.
     */
    mode?: Mode
    /**
     * Extractor options for static rendering mode.
     */
    extractorOptions?: ExtractorOptions
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
    extractorOptions: ExtractorOptions
    buildReport: boolean | string
    debug: boolean
    adapterOrder: AdapterOrder
}

declare global {
    var __MASTER_CSS_NEXT_OPTIONS__: Options | undefined
}

export function resolveOptions(options: Options = {}): ResolvedOptions {
    return {
        mode: options.mode ?? 'pre-render',
        extractorOptions: options.extractorOptions ?? {},
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
