import type { Config } from 'shared/css-config'
import type { CSSConfigLoadResult } from '@master/css-integration/config-module'

export interface LoadConfigOptions {
    classes?: string[]
    config?: Config
    onWarning?: (warning: string) => void
}

export type LoadConfigResult = CSSConfigLoadResult<Config>

export interface LoadProjectConfigOptions extends LoadConfigOptions {
    entries?: string[]
}

export type LoadProjectConfigResult = LoadConfigResult & {
    entries: string[]
}
