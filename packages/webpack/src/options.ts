import type { ScannerOptions } from '@master/css-scanner'

export type Mode = 'runtime' | 'static' | 'progressive' | 'pre-render' | null

export interface PluginOptions {
    mode?: Mode
    injectRuntime?: boolean
    scanner?: ScannerOptions
}

export interface ResolvedPluginOptions {
    mode: Mode
    injectRuntime: boolean
    scanner: ScannerOptions
}

function isPluginOptions(options: ScannerOptions | PluginOptions): options is PluginOptions {
    return 'mode' in options || 'injectRuntime' in options || 'scanner' in options
}

export function resolvePluginOptions(options: ScannerOptions | PluginOptions = {}): ResolvedPluginOptions {
    if (isPluginOptions(options)) {
        return {
            mode: options.mode === undefined ? 'runtime' : options.mode,
            injectRuntime: options.injectRuntime ?? true,
            scanner: options.scanner ?? {}
        }
    }

    return {
        mode: 'runtime',
        injectRuntime: true,
        scanner: options
    }
}

export function shouldInjectRuntime(options: ResolvedPluginOptions) {
    return options.injectRuntime && (options.mode === 'runtime' || options.mode === 'progressive')
}

export function shouldPreloadRuntime(options: ResolvedPluginOptions) {
    return options.injectRuntime && options.mode === 'runtime'
}
