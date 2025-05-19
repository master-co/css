import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import cssDataProvider from './css-data-provider'
import { MasterCSS, createCSS, SyntaxRuleType, SyntaxRuleTypeValue, Variable, generateCSS, isCoreRule } from '@master/css'
import { getCSSDataDocumentation } from './get-css-data-documentation'
import sortCompletionItems from './sort-completion-items'
import type { IValueData } from 'vscode-css-languageservice'

const SCOPED_VARIABLE_PRIORITY = 'aaaa'
const AMBIGUOUS_PRIORITY = 'bbbb'
const NATIVE_PRIORITY = 'ccccc'
const GLOBAL_VARIABLE_PRIORITY = 'zzzz'

export default function getValueCompletionItems(css: MasterCSS = createCSS(), ruleKey: string): CompletionItem[] {
    const nativeProperties = cssDataProvider.provideProperties()
    const completionItems: CompletionItem[] = []
    const nativeKey = css.definedRules.find(({ keys }) => keys.includes(ruleKey))?.id
    const nativePropertyData = nativeProperties.find(({ name }) => name === nativeKey)
    const generateVariableCompletionItem = (variable: Variable, { scoped } = { scoped: false }): CompletionItem | undefined => {
        const eachNativePropertyData = nativeProperties.find((x: { name: string }) => x.name === variable.group) || nativePropertyData
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
        if (variable.type === 'color') {
            if (Object.keys(variable.modes || {}).length) {
                completionItem.kind = CompletionItemKind.Color
                completionItem.detail = variable.name
            } else {
                // todo: packages/core should support getTextByVariable(variable)
                const configKey = 'variables.' + (variable.group ? variable.group + '.' + variable.key : variable.name)
                const valueToken = ((variable.space && variable.value)
                    // vscode doesn't support rgba(0 0 0/.5) in detail
                    ? `${variable.space}(${variable.value.split(' ').join(',')})`
                    : variable.value)
                // detail is shown in the detail pane
                // todo: variable.token should be recorded as original config variable
                completionItem.detail = String(configKey)
                completionItem.documentation = {
                    kind: 'markdown',
                    value: valueToken + '\n\n' + documentation?.value
                }
                completionItem.kind = CompletionItemKind.Color
                completionItem.sortText = 'color-' + variable.name.replace(/(.+?)-(\d+)/, (match, prefix, num) =>
                    prefix + num.padStart(10, '0'))
            }
        } else if (variable.type === 'number') {
            if (variable.name.startsWith('-') && eachNativePropertyData?.syntax?.includes('absolute')) return
            completionItem.detail = String(variable.name)
            completionItem.sortText = (variable.group || '') + (variable.value >= 0
                ? String(variable.value).padStart(10, '0')
                : '-' + String(Math.abs(variable.value)).padStart(10, '0'))
        } else {
            completionItem.detail = String(variable.value || variable.name)
        }
        return completionItem
    }

    for (const eachDefinedRule of css.definedRules) {
        /**
         * Scoped variables
         * @example box: + content -> box-sizing:content
         */
        if (eachDefinedRule.definition.key === ruleKey || eachDefinedRule.definition.subkey === ruleKey || eachDefinedRule.definition.aliasGroups?.includes(ruleKey)) {
            for (const variableName in eachDefinedRule.variables) {
                if (completionItems.find(({ label }) => label === variableName)) continue
                const variable = eachDefinedRule.variables.get(variableName)
                if (!variable) continue
                const completionItem = generateVariableCompletionItem(variable, { scoped: true })
                if (completionItem) {
                    completionItem.label = variableName
                    completionItem.sortText = SCOPED_VARIABLE_PRIORITY + variableName
                    completionItem.detail = '(scope) ' + completionItem.detail
                    completionItems.push(completionItem)
                }
            }
        }

        /**
         * @example animation:fade
         */
        if (eachDefinedRule.keys.includes(ruleKey) && eachDefinedRule.definition.includeAnimations) {
            css.animations.forEach((animation, animationName) => {
                const isNative = eachDefinedRule.definition.type && ([SyntaxRuleType.Native, SyntaxRuleType.NativeShorthand] as SyntaxRuleTypeValue[]).includes(eachDefinedRule.definition.type)
                completionItems.push({
                    label: animationName,
                    kind: CompletionItemKind.Value,
                    documentation: getCSSDataDocumentation(undefined, {
                        generatedCSS: generateCSS([ruleKey + ':' + animationName], css),
                        docs: '/reference/' + isCoreRule(eachDefinedRule.id) && eachDefinedRule.id
                    }),
                    detail: isNative ? eachDefinedRule.id + ': ' + animationName : animationName
                })
            })
        }

        /**
         * Ambiguous values
         * @example text: -> center, left, right, justify
         * @example t: -> center, left, right, justify
         */
        if (eachDefinedRule.definition.aliasGroups?.includes(ruleKey) && eachDefinedRule.definition.values?.length) {
            const nativePropertyData = nativeProperties.find((x: { name: string }) => x.name === eachDefinedRule.id)
            for (const value of eachDefinedRule.definition.values) {
                if (typeof value !== 'string') continue
                const nativeValueData = nativePropertyData?.values?.find((x: { name: string }) => x.name === value)
                const isNative = eachDefinedRule.definition.type && ([SyntaxRuleType.Native, SyntaxRuleType.NativeShorthand] as SyntaxRuleTypeValue[]).includes(eachDefinedRule.definition.type)
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
                        docs: '/reference/' + isCoreRule(eachDefinedRule.id) && eachDefinedRule.id
                    }),
                    detail: isNative ? eachDefinedRule.id + ': ' + value : value
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