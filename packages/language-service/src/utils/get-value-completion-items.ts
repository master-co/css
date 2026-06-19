import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import { MasterCSS, createDefaultCSS, type Variable, generateCSS } from '../master-css'
import { builtinKeyAliases } from '@master/css-engine'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import sortCompletionItems from './sort-completion-items'
import { getMdnPropertySyntax, getMdnPropertyValueNames } from './mdn-css-data'
import { createCompletionIndex, type CompletionIndex } from './completion-index'

const SCOPED_VARIABLE_PRIORITY = 'aaaa'
const NATIVE_PRIORITY = 'ccccc'
const GLOBAL_VARIABLE_PRIORITY = 'zzzz'
const ANIMATION_REFERENCE_PROPERTIES = new Set(['animation', 'animation-name'])

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

function getVariableKeyByNamespace(variableName: string, namespace: string) {
    const negative = variableName.startsWith('-')
    const positiveName = negative ? variableName.slice(1) : variableName
    if (positiveName !== namespace && !positiveName.startsWith(namespace + '-')) return
    const key = positiveName === namespace ? '' : positiveName.slice(namespace.length + 1)
    return negative ? '-' + key : key
}

export default function getValueCompletionItems(css: MasterCSS = createDefaultCSS(), ruleKey: string, valuePrefix = '', completionIndex: CompletionIndex = createCompletionIndex(css)): CompletionItem[] {
    const completionItems: CompletionItem[] = []
    const addedLabels = new Set<string>()
    const canonicalRuleKey = builtinKeyAliases[ruleKey] || ruleKey
    const nativeUtilityKey = completionIndex.nativeUtilityKeys.get(canonicalRuleKey)
    const nativeKey = nativeUtilityKey || (getMdnPropertySyntax(canonicalRuleKey) ? canonicalRuleKey : undefined)
    const nativePropertyValues = getMdnPropertyValueNames(nativeKey)
    const pushCompletionItem = (completionItem: CompletionItem) => {
        completionItems.push(completionItem)
        addedLabels.add(completionItem.label)
    }
    const generateVariableCompletionItem = (variable: Variable, {
        appliedValue,
        label,
        negative,
        scoped
    }: GenerateVariableCompletionItemOptions = {}): CompletionItem | undefined => {
        const nativePropertySyntax = getMdnPropertySyntax(variable.namespace) || getMdnPropertySyntax(nativeKey)
        if (variable.type === 'number' && variable.name.startsWith('-') && nativePropertySyntax?.includes('absolute')) return
        const valueToken = appliedValue ?? (scoped ? variable.key : variable.name)
        const documentation = createCSSMarkdownDocumentation(generateCSS([ruleKey + ':' + valueToken], css))
        const completionItemLabel = label ?? variable.name
        const conflicted = addedLabels.has(completionItemLabel)
        const completionItem: CompletionItem = {
            label: conflicted ? 'var(--' + completionItemLabel + ')' : completionItemLabel,
            kind: CompletionItemKind.Value
        }
        if (conflicted) {
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
    const addScopedVariableCompletionItem = (variable: Variable, variableName: string) => {
        if (addedLabels.has(variableName)) return
        const completionItem = generateVariableCompletionItem(variable, { scoped: true })
        if (completionItem) {
            completionItem.label = variableName
            completionItem.sortText = SCOPED_VARIABLE_PRIORITY + (completionItem.sortText || variableName)
            completionItem.detail = '(scope) ' + completionItem.detail
            pushCompletionItem(completionItem)
        }
        const negativeVariableName = '-' + variableName
        if (
            valuePrefix.startsWith('-')
            && variableName[0] !== '-'
            && variable.type === 'number'
            && !addedLabels.has(negativeVariableName)
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
                pushCompletionItem(negativeCompletionItem)
            }
        }
    }

    /**
     * Scoped variables
     * @example box: + content -> box-sizing:content
     */
    for (const { name, variable } of completionIndex.scopedVariablesByKey.get(canonicalRuleKey) || []) {
        addScopedVariableCompletionItem(variable, name)
    }

    for (const { value } of completionIndex.patternValuesByKey.get(canonicalRuleKey) || []) {
        if (addedLabels.has(value)) continue
        pushCompletionItem({
            label: value,
            kind: CompletionItemKind.Value,
            documentation: createCSSMarkdownDocumentation(generateCSS([ruleKey + ':' + value], css)),
            detail: canonicalRuleKey + ': ' + value
        })
    }

    /**
     * @example animation:fade|fast animate:fade animation-name:fade
     */
    for (const animationUtility of completionIndex.animationUtilitiesByKey.get(canonicalRuleKey) || []) {
        css.animations.forEach((_, animationName) => {
            pushCompletionItem({
                label: animationName,
                kind: CompletionItemKind.Value,
                documentation: createCSSMarkdownDocumentation(generateCSS([ruleKey + ':' + animationName], css)),
                detail: animationUtility.detailPrefix ? animationUtility.detailPrefix + ': ' + animationName : animationName
            })
        })
    }

    if (ANIMATION_REFERENCE_PROPERTIES.has(canonicalRuleKey)) {
        css.animations.forEach((_, animationName) => {
            if (addedLabels.has(animationName)) return
            pushCompletionItem({
                label: animationName,
                kind: CompletionItemKind.Value,
                documentation: createCSSMarkdownDocumentation(generateCSS([ruleKey + ':' + animationName], css)),
                detail: canonicalRuleKey + ': ' + animationName
            })
        })
    }

    const usedKeys = new Set<string>()
    for (const variableNamespace of completionIndex.nativeVariableNamespacesByProperty.get(canonicalRuleKey) || []) {
        for (const variable of completionIndex.variables) {
            const variableName = getVariableKeyByNamespace(variable.name, variableNamespace)
            if (variableName === undefined || usedKeys.has(variableName)) continue
            usedKeys.add(variableName)
            addScopedVariableCompletionItem(variable, variableName)
        }
    }

    /**
     * Native values
     */
    if (nativeKey) {
        nativePropertyValues
            .forEach(value => {
                if (addedLabels.has(value)
                    // should ignore 100, 200 ... 900
                    || nativeKey === 'font' && typeof +value === 'number'
                    // should ignore blanks
                    || value.includes(' ')
                ) return
                pushCompletionItem({
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
    completionIndex.variables.forEach((variable) => {
        const completionItem = generateVariableCompletionItem(variable)
        if (completionItem) {
            completionItem.sortText = GLOBAL_VARIABLE_PRIORITY + (completionItem.sortText || completionItem.label)
            completionItem.detail = '(global) ' + completionItem.detail
            pushCompletionItem(completionItem)
        }
    })

    return sortCompletionItems(completionItems)
}
