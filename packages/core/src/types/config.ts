import type { PropertiesHyphen } from 'csstype'
import { AT_IDENTIFIERS } from '../common'
import { DeclarerNames } from '../declarers'
import { TransformerNames } from '../transformers'
import { FunctionTransformerNames } from '../function-transformers'
import SyntaxRuleType from '../syntax-rule-type'

export type CSSDeclarations = PropertiesHyphen | Record<string, string | number | undefined | (string | number | undefined)[]>

export interface SyntaxRuleDefinition {
    name: string
    type?: SyntaxRuleType
    matcher?: RegExp | string
    sign?: string
    key?: string
    subkey?: string
    aliasGroups?: string[]
    values?: string[]
    kind?: 'number' | 'color' | 'image'
    namespaces?: string[]
    separators?: string[]
    unit?: any
    declarations?: CSSDeclarations | (keyof PropertiesHyphen)[]
    includeAnimations?: boolean
    declarer?: DeclarerNames
    declarerOptions?: unknown
    transformer?: TransformerNames
    transformerOptions?: unknown
}

export type VariableValue = number | string | false | (number | string)[]
export interface VariableDefinition {
    key: string
    namespace?: string
    value: VariableValue
    mode?: string
}
export type CSSKeyframes = Record<'from' | 'to' | string, PropertiesHyphen>
export type AnimationDefinitions = Record<string, CSSKeyframes>;
export type SelectorAliasDefinitions = Record<string, string>;
export type AtIdentifier = typeof AT_IDENTIFIERS[number]
export type AtRuleAliasDefinition = number | string
export interface AtRuleAliasDefinitions {
    [key: string]: AtRuleAliasDefinition | AtRuleAliasDefinitions;
}
export interface ComponentSelectorDefinition {
    selector: string
    declarations: CSSDeclarations
}
export type ComponentDefinition = string | ComponentSelectorDefinition
export type ComponentDefinitions = Record<string, ComponentDefinition[]>
export type SyntaxRuleDefinitions = SyntaxRuleDefinition[]
export type VariableDefinitions = VariableDefinition[]
export type ModeDefinitions = string[];
export interface FunctionDefinition {
    unit?: string
    transformer?: FunctionTransformerNames
    transformerOptions?: unknown
}
export type FunctionDefinitions = Record<string, FunctionDefinition>;

export interface Config {
    extends?: (Config | any)[]
    components?: ComponentDefinitions
    atRuleAliases?: AtRuleAliasDefinitions
    selectorAliases?: SelectorAliasDefinitions
    variables?: VariableDefinitions
    rules?: SyntaxRuleDefinitions
    rootSize?: number
    baseUnit?: number
    defaultMode?: 'light' | 'dark' | string | false
    scope?: string
    important?: boolean
    functions?: FunctionDefinitions
    animations?: AnimationDefinitions
    modes?: ModeDefinitions
    modeTrigger?: 'class' | 'media' | 'host'
}

declare module 'csstype' {
    interface PropertiesHyphen {
        '-webkit-user-drag'?: 'auto' | 'element' | 'none' | 'inherit'
        'user-drag'?: 'auto' | 'element' | 'none' | 'inherit'
        '-webkit-text-decoration'?: string
    }
}
