// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../master-css-config.d.ts" />

import themeConfig from '../theme.css?master-css-config'
import utilities from './config/utilities'
import functions from './config/functions'
import type {
    AnimationDefinitions,
    AtTokenDefinitions,
    Config,
    ModeDefinitions,
    SelectorTokenDefinitions,
    VariableDefinitions
} from 'shared/css-config'

const atTokens = themeConfig.atTokens || {} satisfies AtTokenDefinitions
const selectorTokens = themeConfig.selectorTokens || {} satisfies SelectorTokenDefinitions
const animations = themeConfig.animations || {} satisfies AnimationDefinitions
const themeVariables = themeConfig.variables || [] satisfies VariableDefinitions
const variables = [
    ...themeVariables.filter(({ namespace }) => namespace !== 'screen'),
    ...themeVariables.filter(({ namespace }) => namespace === 'screen')
] satisfies VariableDefinitions
const modes = themeConfig.modes?.length
    ? themeConfig.modes
    : [...new Set(variables.map(({ mode }) => mode).filter(Boolean))] as ModeDefinitions
const screens = Object.fromEntries(
    variables
        .filter(({ namespace, value }) => namespace === 'screen' && typeof value === 'number')
        .map(({ key, value }) => [key, value])
) as Record<string, number>

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
