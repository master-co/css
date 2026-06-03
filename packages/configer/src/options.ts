import type { Config } from 'shared/css-config'
import type { CSSDirectiveConfigAdapter } from 'shared/css-config-loader'
import type { CSSConfigLoadResult } from 'shared/css-config-module'

export interface LoadConfigOptions {
    classes?: string[]
    config?: Config
    onWarning?: (warning: string) => void
    createConfigFromCSSDirectives?: CSSDirectiveConfigAdapter<Config>
}

export type LoadConfigResult = CSSConfigLoadResult<Config>

export interface LoadProjectConfigOptions extends LoadConfigOptions {
    entries?: string[]
}

export type LoadProjectConfigResult = LoadConfigResult & {
    entries: string[]
}
