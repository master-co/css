import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import { MasterCSS, createDefaultCSS, UtilityType, type Variable, generateCSS } from '../master-css'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import sortCompletionItems from './sort-completion-items'
import { getMdnPropertySyntax, getMdnPropertyValueNames } from './mdn-css-data'

const SCOPED_VARIABLE_PRIORITY = 'aaaa'
const AMBIGUOUS_PRIORITY = 'bbbb'
const NATIVE_PRIORITY = 'ccccc'
const GLOBAL_VARIABLE_PRIORITY = 'zzzz'
const NATIVE_UTILITY_TYPES = new Set<number>([UtilityType.Native, UtilityType.NativeShorthand])

interface GenerateVariableCompletionItemOptions {
    appliedValue?: string
    label?: string
    negative?: boolean
    scoped?: boolean
}

function getNumericSortValue(variable: Variable, rootSize: number) {
    if (variable.numeric) {
        switch (variable.numeric.unit) {
            case 'rem':
                return variable.numeric.value * rootSize
            case undefined:
            case '':
            case 'px':
                return variable.numeric.value
        }
    }
    return typeof variable.value === 'number' ? variable.value : 0
}

export default function getValueCompletionItems(css: MasterCSS = createDefaultCSS(), ruleKey: string, valuePrefix = ''): CompletionItem[] {
    const completionItems: CompletionItem[] = []
    const nativeKey = css.definedUtilities.find(({ keys }) => keys?.includes(ruleKey))?.id
    const nativePropertyValues = getMdnPropertyValueNames(nativeKey)
    const generateVariableCompletionItem = (variable: Variable, {
        appliedValue,
        label,
        negative,
        scoped
    }: GenerateVariableCompletionItemOptions = {}): CompletionItem | undefined => {
        const nativePropertySyntax = getMdnPropertySyntax(variable.namespace) || getMdnPropertySyntax(nativeKey)
        const valueToken = appliedValue ?? (scoped ? variable.key : variable.name)
        const documentation = createCSSMarkdownDocumentation(generateCSS([ruleKey + ':' + valueToken], css))
        const completionItem: CompletionItem = {
            label: label ?? variable.name,
            kind: CompletionItemKind.Value
        }
        const conflicted = completionItems.find(({ label }) => label === completionItem.label)
        if (conflicted) {
            completionItem.label = '$(' + completionItem.label + ')'
            completionItem.documentation = createCSSMarkdownDocumentation(generateCSS([ruleKey + ':' + completionItem.label], css))
        } else {
            completionItem.documentation = createCSSMarkdownDocumentation(generateCSS([ruleKey + ':' + valueToken], css))
        }
        if (variable.namespace?.startsWith('color')) {
            if (Object.keys(variable.modes || {}).length) {
                completionItem.kind = CompletionItemKind.Color
                completionItem.detail = variable.name
            } else {
                // todo: packages/core should support getTextByVariable(variable)
                const configKey = 'variables.' + (variable.namespace ? variable.namespace + '.' + variable.key : variable.name)
                const valueToken = variable.value ?? variable.name
                // detail is shown in the detail pane
                // todo: variable.token should be recorded as original config variable
                completionItem.detail = String(configKey)
                completionItem.documentation = {
                    kind: 'markdown',
                    value: valueToken + '\n\n' + documentation?.value
                }
                completionItem.kind = CompletionItemKind.Color
                completionItem.sortText = 'color-' + variable.name.replace(/(.+?)-(\d+)/, (match: string, prefix: string, num: string) =>
                    prefix + num.padStart(10, '0'))
            }
        } else if (variable.type === 'number') {
            if (variable.name.startsWith('-') && nativePropertySyntax?.includes('absolute')) return
            completionItem.detail = String(variable.name)
            const value = getNumericSortValue(variable, css.settings.rootSize)
            const sortValue = negative ? -Math.abs(value) : value
            completionItem.sortText = (variable.namespace || '') + (sortValue >= 0
                ? String(sortValue).padStart(10, '0')
                : '-' + String(Math.abs(sortValue)).padStart(10, '0'))
        } else {
            completionItem.detail = String(variable.value || variable.name)
        }
        return completionItem
    }

    for (const eachDefinedUtility of css.definedUtilities) {
        /**
         * Scoped variables
         * @example box: + content -> box-sizing:content
         */
        if (
            eachDefinedUtility.key === ruleKey
            || eachDefinedUtility.subkey === ruleKey
            || eachDefinedUtility.keys?.includes(ruleKey)
            || eachDefinedUtility.aliasGroups?.includes(ruleKey)
        ) {
            eachDefinedUtility.variables?.forEach((variable, variableName) => {
                if (completionItems.find(({ label }) => label === variableName)) return
                const completionItem = generateVariableCompletionItem(variable, { scoped: true })
                if (completionItem) {
                    completionItem.label = variableName
                    completionItem.sortText = SCOPED_VARIABLE_PRIORITY + (completionItem.sortText || variableName)
                    completionItem.detail = '(scope) ' + completionItem.detail
                    completionItems.push(completionItem)
                }
                const negativeVariableName = '-' + variableName
                if (
                    valuePrefix.startsWith('-')
                    && variableName[0] !== '-'
                    && variable.type === 'number'
                    && !completionItems.find(({ label }) => label === negativeVariableName)
                ) {
                    const negativeCompletionItem = generateVariableCompletionItem(variable, {
                        appliedValue: negativeVariableName,
                        label: negativeVariableName,
                        negative: true,
                        scoped: true
                    })
                    if (negativeCompletionItem) {
                        negativeCompletionItem.sortText = SCOPED_VARIABLE_PRIORITY + (negativeCompletionItem.sortText || negativeVariableName)
                        negativeCompletionItem.detail = '(scope) ' + negativeCompletionItem.detail
                        completionItems.push(negativeCompletionItem)
                    }
                }
            })
        }

        /**
         * @example animation:fade
         */
        if (eachDefinedUtility.keys?.includes(ruleKey) && eachDefinedUtility.includeAnimations) {
            css.animations.forEach((_, animationName) => {
                const isNative = eachDefinedUtility.type !== undefined && NATIVE_UTILITY_TYPES.has(eachDefinedUtility.type)
                completionItems.push({
                    label: animationName,
                    kind: CompletionItemKind.Value,
                    documentation: createCSSMarkdownDocumentation(generateCSS([ruleKey + ':' + animationName], css)),
                    detail: isNative ? eachDefinedUtility.id + ': ' + animationName : animationName
                })
            })
        }

        /**
         * Ambiguous values
         * @example text: -> center, left, right, justify
         * @example t: -> center, left, right, justify
         */
        if (eachDefinedUtility.aliasGroups?.includes(ruleKey) && eachDefinedUtility.values?.length) {
            for (const value of eachDefinedUtility.values) {
                if (typeof value !== 'string') continue
                const isNative = eachDefinedUtility.type !== undefined && NATIVE_UTILITY_TYPES.has(eachDefinedUtility.type)
                completionItems.push({
                    label: value,
                    kind: CompletionItemKind.Value,
                    sortText: AMBIGUOUS_PRIORITY + value,
                    documentation: createCSSMarkdownDocumentation(generateCSS([ruleKey + ':' + value], css)),
                    detail: isNative ? eachDefinedUtility.id + ': ' + value : value
                })
            }
        }
    }

    /**
     * Native values
     */
    if (nativeKey) {
        nativePropertyValues
            .forEach(value => {
                if (completionItems.find(x => x.label === value)
                    // should ignore 100, 200 ... 900
                    || nativeKey === 'font' && typeof +value === 'number'
                    // should ignore blanks
                    || value.includes(' ')
                ) return
                completionItems.push({
                    label: value,
                    kind: CompletionItemKind.Value,
                    sortText: NATIVE_PRIORITY + (value.startsWith('-')
                        ? 'zz' + value.slice(1)
                        : value),
                    documentation: createCSSMarkdownDocumentation(generateCSS([ruleKey + ':' + value], css)),
                    detail: nativeKey + ': ' + value
                })
            })
    }

    // global variables
    css.variables.forEach((variable) => {
        const completionItem = generateVariableCompletionItem(variable)
        if (completionItem) {
            completionItem.sortText = GLOBAL_VARIABLE_PRIORITY + (completionItem.sortText || completionItem.label)
            completionItem.detail = '(global) ' + completionItem.detail
            completionItems.push(completionItem)
        }
    })

    return sortCompletionItems(completionItems)
}
