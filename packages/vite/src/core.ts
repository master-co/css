import CSSBuilder, { Options as ExtractorOptions } from '@master/css-builder'
import type { Plugin, ResolvedConfig } from 'vite'
import type { Pattern } from 'fast-glob'
import fg from 'fast-glob'
import ExtractMode from './modes/extract'
import RuntimeMode from './modes/runtime'
import { ENTRY_MODULE_PATTERNS } from './common'
import path from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import ProgressiveMode from './modes/progressive'
import { ConfigVirtualModulePlugin } from './plugins/config-virtual-module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pkg = JSON.parse(
    readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
)
const version = 'v' + (pkg.version || '0.0.0')

export interface PluginOptions {
    mode?: 'runtime' | 'extract' | 'progressive' | null
    builder?: ExtractorOptions | Pattern
    config?: string
    inject?: boolean
    avoidFOUC?: boolean
}

export const defaultPluginOptions: PluginOptions = {
    mode: 'runtime',
    config: 'master.css',
    inject: true,
    avoidFOUC: true,
}

export interface PluginContext {
    config?: ResolvedConfig
    entryId?: string
    builder: CSSBuilder
}

export default function masterCSS(options?: PluginOptions): Plugin[] {
    options = { ...defaultPluginOptions, ...options }
    const context = {} as PluginContext
    const ResolveContextPlugin = () => {
        return {
            name: 'master-css:resolve-context',
            enforce: 'pre',
            configResolved(config) {
                context.config = config
                context.entryId = fg.sync(ENTRY_MODULE_PATTERNS, { cwd: config.root, absolute: true, onlyFiles: true })[0]
                if (process.env.DEBUG) {
                    console.log(`[@master/css.vite] mode: ${options.mode}`)
                    console.log(`[@master/css.vite] entry: ${context.entryId || 'none'}`)
                }
            },
        } as Plugin
    }
    const plugins: Plugin[] = [
        ResolveContextPlugin(),
        ConfigVirtualModulePlugin(options, context)
    ]
    switch (options.mode) {
        case 'runtime':
            plugins.push(...RuntimeMode(options, context))
            break
        case 'extract':
            plugins.push(...ExtractMode(options, context))
            break
        case 'progressive':
            plugins.push(...ProgressiveMode(options, context))
            break
    }
    return plugins
}