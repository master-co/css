// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../master-css-config.d.ts" />

import themeConfig from '../theme.css?master-css-config'
import coreFunctions from './functions'
import coreUtilities from './utilities'
import createCSSDirectiveConfig, {
    type CreateConfigFromCSSDirectivesOptions,
    type CSSDirectiveConfigResult
} from './utils/create-config-from-css-directives'
import extendConfig from './utils/extend-config'
import type {
    AnimationDefinitions,
    AtTokenDefinitions,
    Config,
    ModeDefinitions,
    SelectorTokenDefinitions,
    VariableDefinitions
} from 'shared/css-config'

function resolveModes(config: Config, variables: VariableDefinitions) {
    return config.modes?.length
        ? config.modes
        : [...new Set(variables.map(({ mode }) => mode).filter(Boolean))] as ModeDefinitions
}

const variables = themeConfig.variables || [] satisfies VariableDefinitions
const config = {
    ...themeConfig,
    atTokens: themeConfig.atTokens || {},
    selectorTokens: themeConfig.selectorTokens || {},
    utilities: extendConfig(
        { utilities: coreUtilities },
        { utilities: themeConfig.utilities }
    ).utilities || [],
    functions: { ...coreFunctions, ...themeConfig.functions },
    animations: themeConfig.animations || {},
    variables,
    modes: resolveModes(themeConfig, variables)
} satisfies Config

function createConfigFromCSSDirectives(
    input: Parameters<typeof createCSSDirectiveConfig>[0],
    options: CreateConfigFromCSSDirectivesOptions = {}
): CSSDirectiveConfigResult {
    return createCSSDirectiveConfig(input, {
        ...options,
        baseConfig: options.baseConfig ?? config
    })
}

const atTokens = config.atTokens || {} satisfies AtTokenDefinitions
const selectorTokens = config.selectorTokens || {} satisfies SelectorTokenDefinitions
const animations = config.animations || {} satisfies AnimationDefinitions
const modes = config.modes || [] satisfies ModeDefinitions
const utilities = config.utilities || []
const functions = config.functions || {}

export {
    createConfigFromCSSDirectives,
    config,
    atTokens,
    selectorTokens,
    utilities,
    functions,
    animations,
    variables,
    modes
}
