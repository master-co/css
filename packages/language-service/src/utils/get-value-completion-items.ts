import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import cssDataProvider from './css-data-provider'
import { MasterCSS, createDefaultCSS, UtilityType, type Variable, generateCSS, isCoreRule } from '../master-css'
import { getCSSDataDocumentation } from './get-css-data-documentation'
import sortCompletionItems from './sort-completion-items'
import type { IValueData } from 'vscode-css-languageservice'

const SCOPED_VARIABLE_PRIORITY = 'aaaa'
const AMBIGUOUS_PRIORITY = 'bbbb'
const NATIVE_PRIORITY = 'ccccc'
const GLOBAL_VARIABLE_PRIORITY = 'zzzz'
const NATIVE_UTILITY_TYPES = new Set<number>([UtilityType.Native, UtilityType.NativeShorthand])

export default function getValueCompletionItems(css: MasterCSS = createDefaultCSS(), ruleKey: string): CompletionItem[] {
    const nativeProperties = cssDataProvider.provideProperties()
    const completionItems: CompletionItem[] = []
    const nativeKey = css.definedUtilities.find(({ keys }) => keys?.includes(ruleKey))?.id
    const nativePropertyData = nativeProperties.find(({ name }) => name === nativeKey)
    const generateVariableCompletionItem = (variable: Variable, { scoped } = { scoped: false }): CompletionItem | undefined => {
        const eachNativePropertyData = nativeProperties.find((x: { name: string }) => x.name === variable.namespace) || nativePropertyData
        const appliedValue = scoped ? variable.key : variable.name
        const documentation = getCSSDataDocumentation(eachNativePropertyData, {
            generatedCSS: generateCSS([ruleKey + ':' + appliedValue], css),
            docs: '/reference/' + (eachNativePropertyData?.name || 'variables')
        })
        const completionItem: CompletionItem = {
            label: variable.name,
            kind: CompletionItemKind.Value
        }
        const conflicted = completionItems.find(({ label }) => label === variable.name)
        if (conflicted) {
            completionItem.label = '$(' + completionItem.label + ')'
            completionItem.documentation = getCSSDataDocumentation(eachNativePropertyData, {
                generatedCSS: generateCSS([ruleKey + ':' + completionItem.label], css),
                docs: '/reference/' + (eachNativePropertyData?.name || 'variables')
            })
        } else {
            completionItem.documentation = getCSSDataDocumentation(eachNativePropertyData, {
                generatedCSS: generateCSS([ruleKey + ':' + appliedValue], css),
                docs: '/reference/' + (eachNativePropertyData?.name || 'variables')
            })
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
            if (variable.name.startsWith('-') && eachNativePropertyData?.syntax?.includes('absolute')) return
            completionItem.detail = String(variable.name)
            const value = typeof variable.value === 'number' ? variable.value : 0
            completionItem.sortText = (variable.namespace || '') + (value >= 0
                ? String(value).padStart(10, '0')
                : '-' + String(Math.abs(value)).padStart(10, '0'))
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
                    documentation: getCSSDataDocumentation(undefined, {
                        generatedCSS: generateCSS([ruleKey + ':' + animationName], css),
                        docs: '/reference/' + isCoreRule(eachDefinedUtility.id) && eachDefinedUtility.id
                    }),
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
            const nativePropertyData = nativeProperties.find((x: { name: string }) => x.name === eachDefinedUtility.id)
            for (const value of eachDefinedUtility.values) {
                if (typeof value !== 'string') continue
                const nativeValueData = nativePropertyData?.values?.find((x: { name: string }) => x.name === value)
                const isNative = eachDefinedUtility.type !== undefined && NATIVE_UTILITY_TYPES.has(eachDefinedUtility.type)
                completionItems.push({
                    label: value,
                    kind: CompletionItemKind.Value,
                    sortText: AMBIGUOUS_PRIORITY + value,
                    documentation: getCSSDataDocumentation({
                        ...(nativeValueData || {} as IValueData),
                        // use nativePropertyData.reference because nativeValueData does not have references
                        references: nativePropertyData?.references
                    }, {
                        generatedCSS: generateCSS([ruleKey + ':' + value], css),
                        docs: '/reference/' + isCoreRule(eachDefinedUtility.id) && eachDefinedUtility.id
                    }),
                    detail: isNative ? eachDefinedUtility.id + ': ' + value : value
                })
            }
        }
    }

    /**
     * Native values
     */
    if (nativeKey) {
        nativePropertyData?.values
            ?.forEach(value => {
                if (completionItems.find(x => x.label === value.name)
                    // should ignore 100, 200 ... 900
                    || nativePropertyData.name === 'font' && typeof +value.name === 'number'
                    // should ignore blanks
                    || value.name.includes(' ')
                ) return
                completionItems.push({
                    label: value.name,
                    kind: CompletionItemKind.Value,
                    sortText: NATIVE_PRIORITY + (value.name.startsWith('-')
                        ? 'zz' + value.name.slice(1)
                        : value.name),
                    documentation: getCSSDataDocumentation({
                        ...value,
                        // use nativePropertyData.reference because nativeValueData does not have references
                        references: nativePropertyData?.references
                    }, {
                        generatedCSS: generateCSS([ruleKey + ':' + value.name], css),
                        docs: '/reference/' + nativeKey
                    }),
                    detail: nativeKey + ': ' + value.name
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
