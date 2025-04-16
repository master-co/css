import CSSExtractor, { Options as ExtractorOptions } from '@master/css-extractor'
import type { Plugin, ResolvedConfig } from 'vite'
import type { Pattern } from 'fast-glob'
import fg from 'fast-glob'
import { ENTRY_MODULE_PATTERNS } from './common'
import { ConfigVirtualModulePlugin } from './plugins/config-virtual-module'
import path from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import ExtractMode from './modes/extract'
import RuntimeMode from './modes/runtime'
import ProgressiveMode from './modes/progressive'
import PreRenderMode from './modes/pre-render'
import InjectNormalCSSPlugin from './plugins/inject-normal-css'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pkg = JSON.parse(
    readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
)
const version = 'v' + (pkg.version || '0.0.0')

export interface PluginOptions {
    mode?: 'runtime' | 'extract' | 'progressive' | 'pre-render' | null
    extractor?: ExtractorOptions | Pattern
    config?: string
    injectNormalCSS?: boolean
    injectRuntime?: boolean
    injectVirtualModule?: boolean
    avoidFOUC?: boolean
}

export const defaultPluginOptions: PluginOptions = {
    mode: 'runtime',
    config: 'master.css',
    injectNormalCSS: true,
    injectRuntime: true,
    injectVirtualModule: true,
    avoidFOUC: true,
}

export interface PluginContext {
    config?: ResolvedConfig
    entryId?: string
    configPath?: string
    extractor: CSSExtractor
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
                context.entryId = fg.sync(ENTRY_MODULE_PATTERNS, { cwd: config.root, absolute: true, onlyFiles: true, caseSensitiveMatch: false })[0]
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
        case 'pre-render':
            plugins.push(...PreRenderMode(options, context))
            break
    }

    if (options.injectNormalCSS) {
        plugins.push(InjectNormalCSSPlugin(options, context))
    }

    return plugins
}