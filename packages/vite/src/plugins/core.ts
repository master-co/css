import { Options as ExtractorOptions } from '@master/css-builder'
import type { Plugin } from 'vite'
import type { Pattern } from 'fast-glob'
import CSSExtractorPlugins from './css-builder'

export interface Options {
    builder?: ExtractorOptions | Pattern
    mode: 'extract'
}

const defaultOptions: Options = {
    mode: 'extract'
}

export default function masterCSSPlugin(
    options = defaultOptions,
    cwd = process.cwd()
): Plugin[] {
    switch (options.mode) {
        case 'extract':
            return CSSExtractorPlugins(options, cwd)
        default:
            throw new Error(`Unknown mode: ${options.mode}`)
    }
}