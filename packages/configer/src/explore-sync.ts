import {
    DEFAULT_MISSING,
    DEFAULT_FOUND,
    resolveConfigPath
} from './path'
import { loadConfigSync } from './load-sync'
import type { ExploreConfigOptions, ExploreConfigResult } from './options'

export type {
    ExploreConfigOptions,
    ExploreConfigPath,
    ExploreConfigResult
} from './options'

export function exploreConfigSync(options: ExploreConfigOptions = {}) {
    const resolvedConfig = resolveConfigPath(options)
    if (!resolvedConfig) {
        const missing = Object.hasOwn(options, 'missing') ? options.missing : DEFAULT_MISSING
        missing?.(options.name || 'master.css', options.cwd || '')
        return
    }
    const result = loadConfigSync(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        ...result
    } satisfies ExploreConfigResult
}

export default exploreConfigSync
