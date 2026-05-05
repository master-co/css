import atRuleAliases from './config/at-rule-aliases'
import selectorAliases from './config/selector-aliases'
import animations from './config/animations'
import variables, { modes, screens } from './config/variables'
import utilities from './config/utilities'
import functions from './config/functions'
import type { Config } from './types/config'

const config: Config = {
    atRuleAliases,
    selectorAliases,
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
    atRuleAliases,
    selectorAliases,
    utilities,
    functions,
    animations,
    variables,
    modes,
    screens
}
