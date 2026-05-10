import type { Config } from '@master/css'
import type { Options as ExtractorOptions } from '@master/css-extractor'

export type Mode = 'pre-render' | 'extract' | null

export interface Options {
    /**
     * Next.js integration mode.
     * Set to `null` to skip rendering modes while keeping the CSS config loaders.
     */
    mode?: Mode
    /**
     * Master CSS config object or config file basename/path.
     * Defaults to `master.css`.
     */
    config?: string | Config
    /**
     * Extractor options for static extraction mode.
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
}

export interface ResolvedOptions {
    mode: Mode
    config: string | Config
    extractorOptions: ExtractorOptions
    module: string
    manifest: boolean | string
    debug: boolean
}

declare global {
    var __MASTER_CSS_NEXT_OPTIONS__: Options | undefined
}

export function resolveOptions(options: Options = {}): ResolvedOptions {
    return {
        mode: options.mode ?? 'pre-render',
        config: options.config ?? 'master.css',
        extractorOptions: options.extractorOptions ?? {},
        module: options.extractorOptions?.module ?? 'virtual:master.css',
        manifest: options.manifest ?? false,
        debug: options.debug ?? false
    }
}

export function registerOptions(options: Options) {
    globalThis.__MASTER_CSS_NEXT_OPTIONS__ = options
}

export function getRegisteredOptions() {
    return globalThis.__MASTER_CSS_NEXT_OPTIONS__
}
