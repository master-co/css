import { Options as ExtractorOptions } from '@master/css-builder'
import type { Plugin, ResolvedConfig } from 'vite'
import type { Pattern } from 'fast-glob'
import fg from 'fast-glob'
import ExtractMode from './modes/extract'
import RuntimeMode from './modes/runtime'
import { ENTRY_MODULE_PATTERNS } from './common'
import path from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pkg = JSON.parse(
    readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
)
const version = 'v' + (pkg.version || '0.0.0')

export interface PluginOptions {
    mode?: 'runtime' | 'extract' | 'progressive'
    builder?: ExtractorOptions | Pattern
    config?: string
    inject?: boolean
    avoidFOUC?: boolean
}

const defaultOptions: PluginOptions = {
    mode: 'runtime',
    config: 'master.css',
    inject: true,
    avoidFOUC: true,
}

export interface PluginContext {
    config?: ResolvedConfig
    entryId?: string
    configId?: string
}

export default function masterCSSPlugin(options: PluginOptions): Plugin[] {
    options = { ...defaultOptions, ...options }
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
                if (process.env.DEBUG) {
                    console.log(`[@master/css.vite] enabled ${options.mode} mode`)
                    console.log(`[@master/css.vite] found config ${context.configId || 'none'}`)
                    console.log(`[@master/css.vite] found entry ${context.entryId || 'none'}`)
                }
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