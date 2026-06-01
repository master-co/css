import { resolve } from 'node:path'
import { createCSS, extendConfig } from '@master/css'
import type { Config } from 'shared/css-config'
import { loadConfig, resolveConfigPath, type ExploreConfigResult } from '@master/css-explore-config'
import { warnMissingNextConfig } from './config-warning'

export interface MasterCSSBuildConfig {
    config: Config
    nativeCSS: string
    dependencies: string[]
    styleSources: string[]
}

export async function resolveMasterCSSBuildConfig(
    projectDir: string,
    configOption: string | Config,
    classes?: string[]
): Promise<MasterCSSBuildConfig> {
    let rootConfigResult: ExploreConfigResult | undefined
    if (typeof configOption === 'string') {
        const resolvedConfig = resolveConfigPath({ cwd: projectDir, name: configOption })
        if (resolvedConfig) {
            rootConfigResult = {
                ...resolvedConfig,
                ...await loadConfig(resolvedConfig.path, { classes })
            }
        } else {
            warnMissingNextConfig(projectDir, configOption)
        }
    }
    const rootConfig = typeof configOption === 'string'
        ? rootConfigResult?.config
        : configOption
    const rootDependencies = rootConfigResult?.dependencies || []
    const configs = [rootConfig].filter(Boolean) as Config[]
    const config = configs.length ? extendConfig(...configs) : createCSS().config

    return {
        config,
        nativeCSS: rootConfigResult?.nativeCSS || '',
        dependencies: rootDependencies.map((dependency) => resolve(dependency)),
        styleSources: []
    }
}
