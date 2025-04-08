import at from './at'
import selectors from './selectors'
import utilities from './utilities'
import animations from './animations'
import variables from './variables'
import rules from './rules'
import modes from './modes'
import functions from './functions'
import screens from './screens'
import { Config } from '../types/config'

const config: Config = {
    at,
    selectors,
    utilities,
    rules,
    functions,
    animations,
    variables,
    modes,
    screens,
    scope: '',
    rootSize: 16,
    baseUnit: 4,
    override: false,
    important: false,
    defaultMode: 'light'
}

export {
    config,
    at,
    selectors,
    utilities,
    rules,
    functions,
    animations,
    variables,
    modes,
    screens
}