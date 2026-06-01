// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../master-css-config.d.ts" />

import themeConfig from '../theme.css?master-css-config'
import createDefaultConfig from './utils/create-default-config'
import type {
    AnimationDefinitions,
    AtTokenDefinitions,
    ModeDefinitions,
    SelectorTokenDefinitions,
    VariableDefinitions
} from 'shared/css-config'

const config = createDefaultConfig(themeConfig)
const atTokens = config.atTokens || {} satisfies AtTokenDefinitions
const selectorTokens = config.selectorTokens || {} satisfies SelectorTokenDefinitions
const animations = config.animations || {} satisfies AnimationDefinitions
const variables = config.variables || [] satisfies VariableDefinitions
const modes = config.modes || [] satisfies ModeDefinitions
const utilities = config.utilities || []
const functions = config.functions || {}

export {
    createDefaultConfig,
    config,
    atTokens,
    selectorTokens,
    utilities,
    functions,
    animations,
    variables,
    modes
}
