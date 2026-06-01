import {
    DEFAULT_FOUND,
    DEFAULT_MISSING,
    resolveConfigPath
} from './path'
import { loadConfig } from './load'
import type { ExploreConfigOptions, ExploreConfigResult } from './options'

export type {
    ExploreConfigOptions,
    ExploreConfigPath,
    ExploreConfigResult
} from './options'

export async function exploreConfig(options: ExploreConfigOptions = {}) {
    const resolvedConfig = resolveConfigPath(options)
    if (!resolvedConfig) {
        const missing = Object.hasOwn(options, 'missing') ? options.missing : DEFAULT_MISSING
        missing?.(options.name || 'master.css', options.cwd || '')
        return
    }
    const result = await loadConfig(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        ...result
    } satisfies ExploreConfigResult
}

export default exploreConfig
