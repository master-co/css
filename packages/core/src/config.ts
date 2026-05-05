import atTokens from './config/at-tokens'
import selectorTokens from './config/selector-tokens'
import animations from './config/animations'
import variables, { modes, screens } from './config/variables'
import utilities from './config/utilities'
import functions from './config/functions'
import type { Config } from './types/config'

const config: Config = {
    atTokens,
    selectorTokens,
    utilities,
    functions,
    animations,
    variables,
    modes,
    scope: '',
    rootSize: 16,
    baseUnit: 4,
    important: false,
    defaultMode: 'light',
    modeTrigger: 'media',
}

export {
    config,
    atTokens,
    selectorTokens,
    utilities,
    functions,
    animations,
    variables,
    modes,
    screens
}
