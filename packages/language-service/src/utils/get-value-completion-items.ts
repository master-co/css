import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import { MasterCSS, createDefaultCSS, type Variable, generateCSS } from '../master-css'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import sortCompletionItems from './sort-completion-items'
import { getMdnPropertySyntax, getMdnPropertyValueNames } from './mdn-css-data'

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

function utilityMayReferenceAnimations(utility: MasterCSS['definedUtilities'][number]) {
    const emit = utility.emit
    switch (emit.type) {
        case 'declarations':
            return emit.declarations.some((property) => ANIMATION_REFERENCE_PROPERTIES.has(property))
        case 'property':
            return ANIMATION_REFERENCE_PROPERTIES.has(emit.property)
        case 'pair':
            return emit.properties.some((property) => ANIMATION_REFERENCE_PROPERTIES.has(property))
        case 'template':
            return Object.keys(emit.declarations).some((property) => ANIMATION_REFERENCE_PROPERTIES.has(property))
        case 'static':
            return emit.rules.some((rule) =>
                Object.keys(rule.declarations).some((property) => ANIMATION_REFERENCE_PROPERTIES.has(property))
            )
        default:
            return false
    }
}

function isPureNativePropertyUtility(utility: MasterCSS['definedUtilities'][number]) {
    return utility.emit.type === 'property'
        && utility.id === utility.emit.property
        && utility.name === utility.emit.property
}

export default function getValueCompletionItems(css: MasterCSS = createDefaultCSS(), ruleKey: string, valuePrefix = ''): CompletionItem[] {
    const completionItems: CompletionItem[] = []
    const canonicalRuleKey = css.plan.keyAliases?.[ruleKey] || ruleKey
    const nativeUtilityKey = css.definedUtilities.find(({ keys }) => keys?.includes(canonicalRuleKey))?.id
    const nativeKey = nativeUtilityKey || (getMdnPropertySyntax(canonicalRuleKey) ? canonicalRuleKey : undefined)
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
            completionItem.label = 'var(--' + completionItem.label + ')'
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
    const addScopedVariableCompletionItem = (variable: Variable, variableName: string) => {
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
    }

    for (const eachDefinedUtility of css.definedUtilities) {
        /**
         * Scoped variables
         * @example box: + content -> box-sizing:content
         */
        if (
            eachDefinedUtility.key === canonicalRuleKey
            || eachDefinedUtility.subkey === canonicalRuleKey
            || eachDefinedUtility.keys?.includes(canonicalRuleKey)
            || eachDefinedUtility.aliasGroups?.includes(canonicalRuleKey)
        ) {
            eachDefinedUtility.variables?.forEach((variable, variableName) => {
                addScopedVariableCompletionItem(variable, variableName)
            })
        }

        /**
         * @example animation:fade
         */
        if (eachDefinedUtility.keys?.includes(canonicalRuleKey) && utilityMayReferenceAnimations(eachDefinedUtility)) {
            css.animations.forEach((_, animationName) => {
                const isNative = isPureNativePropertyUtility(eachDefinedUtility)
                completionItems.push({
                    label: animationName,
                    kind: CompletionItemKind.Value,
                    documentation: createCSSMarkdownDocumentation(generateCSS([ruleKey + ':' + animationName], css)),
                    detail: isNative ? eachDefinedUtility.id + ': ' + animationName : animationName
                })
            })
        }

    }

    for (const namespace of css.plan.nativeValueNamespaces || []) {
        if (!namespace.properties.includes(canonicalRuleKey)) continue
        const usedKeys = new Set<string>()
        for (const ref of namespace.variableAliasRefs || []) {
            const variableNamespace = ref[0] === '=' || ref[0] === '~' ? ref.slice(1) : ''
            if (!variableNamespace) continue
            css.variables.forEach((variable) => {
                const variableName = getVariableKeyByNamespace(variable.name, variableNamespace)
                if (variableName === undefined || usedKeys.has(variableName)) return
                usedKeys.add(variableName)
                addScopedVariableCompletionItem(variable, variableName)
            })
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
