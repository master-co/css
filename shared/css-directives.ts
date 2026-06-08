import type { Config, DefaultModeDefinition, UtilityLayerName, VariableValue } from './css-config.js'

export type CSSDirectiveVariableValue = VariableValue

export type CSSDirectiveDeclarations = Record<string, string>

export type CSSDirectiveLayerName = UtilityLayerName

export type CSSDirectiveModeTrigger = NonNullable<Config['modeTrigger']>

export interface CSSDirectiveVariableDefinition {
    name: string
    value: CSSDirectiveVariableValue
    mode?: string
    namespace?: string
    key?: string
}

export type CSSDirectiveAnimationDefinitions = Record<string, Record<string, CSSDirectiveDeclarations>>

export type CSSDirectiveAtTokenDefinitions = Record<string, string | number>

export type CSSDirectiveSelectorTokenDefinitions = Record<string, string>

export interface CSSDirectiveUtilityRuleDefinition {
    declarations: CSSDirectiveDeclarations
    atRules?: string[]
    selector?: string
}

export interface CSSDirectiveUtilityDefinition {
    name: string
    type?: 'static'
    layer?: CSSDirectiveLayerName
    declarations?: CSSDirectiveDeclarations
    atRules?: string[]
    rules?: CSSDirectiveUtilityRuleDefinition[]
}

export interface CSSDirectiveConfig {
    atTokens?: CSSDirectiveAtTokenDefinitions
    selectorTokens?: CSSDirectiveSelectorTokenDefinitions
    variables?: CSSDirectiveVariableDefinition[]
    utilities?: CSSDirectiveUtilityDefinition[]
    rootSize?: number
    baseUnit?: number
    defaultMode?: DefaultModeDefinition
    scope?: string
    important?: boolean
    animations?: CSSDirectiveAnimationDefinitions
    modes?: string[]
    modeTrigger?: CSSDirectiveModeTrigger
}

export interface CSSDirectiveExtractionPolicy {
    include: string[]
    exclude: string[]
    required: string[]
    safelist: string[]
    blocklist: (string | RegExp)[]
    preserveNative: boolean
}

export interface CSSDirectiveStyleComposeDefinition {
    type: 'compose'
    order: number
    className: string
    selector: string
    atRules?: string[]
    layer?: CSSDirectiveLayerName
    name?: string
}

export interface CSSDirectiveStyleNativeDefinition {
    type: 'native'
    order: number
    selector: string
    declarations: CSSDirectiveDeclarations
    atRules?: string[]
    layer?: CSSDirectiveLayerName
    name?: string
}

export type CSSDirectiveStyleDefinition =
    | CSSDirectiveStyleComposeDefinition
    | CSSDirectiveStyleNativeDefinition

export interface CSSDirectiveResult {
    config: CSSDirectiveConfig
    extractionPolicy: CSSDirectiveExtractionPolicy
    classNames: string[]
    nativeClassNames: string[]
    nativeCSS: string
    css: string
    generatedCSS: string
    warnings: string[]
    dependencies: string[]
    styleDefinitions?: CSSDirectiveStyleDefinition[]
}

export const CSS_DIRECTIVE_AT_RULE_REFERENCE_PREFIX = '__master_at__:'

export function createCSSDirectiveAtRuleReference(token: string) {
    return CSS_DIRECTIVE_AT_RULE_REFERENCE_PREFIX + token
}

export function readCSSDirectiveAtRuleReference(atRule: string) {
    return atRule.startsWith(CSS_DIRECTIVE_AT_RULE_REFERENCE_PREFIX)
        ? atRule.slice(CSS_DIRECTIVE_AT_RULE_REFERENCE_PREFIX.length)
        : undefined
}
