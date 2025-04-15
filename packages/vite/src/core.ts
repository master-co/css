import { Options as ExtractorOptions } from '@master/css-builder'
import type { Plugin, ResolvedConfig } from 'vite'
import type { Pattern } from 'fast-glob'
import fg from 'fast-glob'
import ExtractMode from './modes/extract'
import RuntimeMode from './modes/runtime'
import { ENTRY_MODULE_PATTERNS } from './common'

export interface PluginOptions {
    builder?: ExtractorOptions | Pattern
    mode?: 'extract' | 'runtime'
    config?: string
}

const defaultOptions: PluginOptions = {
    mode: 'runtime',
    config: 'master.css'
}

export interface PluginContext {
    config?: ResolvedConfig
    entryId?: string
    configId?: string
}

export default function masterCSSPlugin(options = defaultOptions): Plugin[] {
    const context = {} as PluginContext
    const configBase = options.config || 'master.css'
    const ResolveContextPlugin = () => {
        return {
            name: 'master-css:resolve-context',
            enforce: 'pre',
            async configResolved(config) {
                context.config = config
                const [basename, ext = ''] = configBase.split('.')
                const pattern = ext ? `${basename}.${ext}.{js,ts,mjs,cjs}` : `${basename}.{js,ts,mjs,cjs}`
                const fgOptions = { cwd: config.root, absolute: true, onlyFiles: true }
                const [configFiles, entryFiles] = await Promise.all([
                    fg(pattern, fgOptions),
                    fg(ENTRY_MODULE_PATTERNS, fgOptions),
                ])
                context.configId = configFiles[0]
                context.entryId = entryFiles[0]
            },
        } as Plugin
    }
    switch (options.mode) {
        case 'runtime':
            return [ResolveContextPlugin(), ...RuntimeMode(options, context)]
        case 'extract':
            return [ResolveContextPlugin(), ...ExtractMode(options, context)]
        default:
            throw new Error(`Unknown mode: ${options.mode}`)
    }
}