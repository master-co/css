import type { Config } from 'shared/css-config'
import type { CSSDirectiveConfigAdapter } from 'shared/css-config-loader'
import type { CSSConfigLoadResult } from 'shared/css-config-module'
import type { ExploreConfigOptions, ExploreConfigPath } from './path'

export type {
    ExploreConfigOptions,
    ExploreConfigPath
} from './path'

export interface LoadConfigOptions extends Pick<ExploreConfigOptions, 'resolvedKeys'> {
    classes?: string[]
    createConfigFromCSSDirectives?: CSSDirectiveConfigAdapter<Config>
}

export type LoadConfigResult = CSSConfigLoadResult<Config>

export type ExploreConfigResult = ExploreConfigPath & LoadConfigResult

export const DEFAULT_RESOLVED_KEYS = [
    'config',
    'default'
]

export function resolveConfig(configModule: Record<string, unknown>, options: Pick<ExploreConfigOptions, 'resolvedKeys'> = {}) {
    const resolvedKeys = options.resolvedKeys || DEFAULT_RESOLVED_KEYS
    let config: unknown
    for (const key of resolvedKeys) {
        config = configModule[key]
        if (config) break
    }
    if (!config) config = configModule
    return config as Config
}
