import { extname } from 'node:path'
import {
    DEFAULT_MISSING,
    DEFAULT_FOUND,
    resolveConfig,
    resolveConfigPath,
    type ExploreConfigOptions,
    type ExploreConfigResult,
    type LoadConfigOptions,
    type LoadConfigResult
} from './shared'
import { collectScriptDependencies, requireConfigModule } from './script'
import { loadCSSConfigSync } from './css'
import { stripResourceQuery, toConfigModuleResult, type ConfigModuleResult } from './module'

export * from './module'
export { loadCSSConfigModuleSync, loadCSSConfigSync } from './css'

export function loadConfigSync(path: string, options: LoadConfigOptions = {}): LoadConfigResult {
    if (extname(path) === '.css') {
        return loadCSSConfigSync(path, options)
    }
    return {
        config: resolveConfig(requireConfigModule(path), options),
        dependencies: collectScriptDependencies(path)
    }
}

export function loadConfigModuleSync(path: string, options: LoadConfigOptions = {}): ConfigModuleResult {
    return toConfigModuleResult(loadConfigSync(stripResourceQuery(path), options))
}

export function exploreConfigSync(options: ExploreConfigOptions & { name?: string } = {}) {
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
