import type { CSSDirectiveConfig, CSSDirectiveResult } from 'shared/css-directives'
import config from './config'
import createCSSDirectiveConfig, {
    type CreateConfigFromCSSDirectivesOptions,
    type CSSDirectiveConfigResult
} from './utils/create-config-from-css-directives'
import extendConfig from './utils/extend-config'

type CSSDirectiveInput = CSSDirectiveResult | CSSDirectiveConfig

export type {
    CreateConfigFromCSSDirectivesOptions,
    CSSDirectiveConfigResult
}

export default function createConfigFromCSSDirectives(input: CSSDirectiveInput, options: CreateConfigFromCSSDirectivesOptions = {}): CSSDirectiveConfigResult {
    return createCSSDirectiveConfig(input, {
        ...options,
        config: extendConfig(config, options.config)
    })
}
