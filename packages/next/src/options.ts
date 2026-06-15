import type { Options as ExtractorOptions } from '@master/css-extractor'

export type Mode = 'pre-render' | 'static' | null
export type AdapterOrder = 'master-first' | 'external-first'

export interface Options {
    /**
     * Next.js integration mode.
     * Set to `null` to skip rendering modes while keeping the CSS plan loaders.
     */
    mode?: Mode
    /**
     * Extractor options for static rendering mode.
     */
    extractorOptions?: ExtractorOptions
    /**
     * Write a build manifest with rendered files.
     * `true` writes `.next/master-css-manifest.json`; a string is resolved from `distDir`.
     */
    manifest?: boolean | string
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
    manifest: boolean | string
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
        manifest: options.manifest ?? false,
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
