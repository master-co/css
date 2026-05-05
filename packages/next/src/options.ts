import type { Config } from '@master/css'

export interface Options {
    /**
     * Build-time HTML pre-rendering mode.
     * Set to `null` to return the Next config unchanged.
     */
    mode?: 'pre-render' | null
    /**
     * Master CSS config object or config file basename/path.
     * Defaults to `master.css`.
     */
    config?: string | Config
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
    mode: 'pre-render' | null
    config: string | Config
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
