import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import { builtinKeyAliases, builtinNativeValueNamespaces } from '@master/css-engine'
import { type AtRule, type MasterCSS, UtilityType, createDefaultCSS } from '@master/css-language'
import type { Variable } from '@master/css-language'
import { getMdnPseudoClassNames, getMdnPseudoElementNames } from '@master/css-language'
import getUtilityInfo from './get-utility-info'
import sortCompletionItems from './sort-completion-items'

const ANIMATION_REFERENCE_PROPERTIES = new Set(['animation', 'animation-name'])

export interface ClassCompletionEntry extends CompletionItem {
    documentationClassName?: string
}

export interface PatternValueCandidate {
    value: string
}

export interface ScopedVariableCandidate {
    name: string
    variable: Variable
}

export interface AnimationUtilityCandidate {
    detailPrefix?: string
}

export interface SelectorVariantCandidate {
    token: string
    selector: string
}

export interface CompletionIndex {
    classEntries: ClassCompletionEntry[]
    componentNames: string[]
    utilityNames: string[]
    nativeUtilityKeys: Map<string, string>
    scopedVariablesByKey: Map<string, ScopedVariableCandidate[]>
    patternValuesByKey: Map<string, PatternValueCandidate[]>
    animationUtilitiesByKey: Map<string, AnimationUtilityCandidate[]>
    nativeVariableNamespacesByProperty: Map<string, string[]>
    variables: Variable[]
    pseudoClassNames: string[]
    pseudoClassSelectors: SelectorVariantCandidate[]
    pseudoElementNames: string[]
    pseudoElementSelectors: SelectorVariantCandidate[]
    atRules: [string, AtRule][]
}

function utilityMayReferenceAnimations(utility: MasterCSS['definedUtilities'][number]) {
    const emit = utility.emit
    switch (emit.type) {
        case 'declarations':
            return emit.declarations.some((property) => ANIMATION_REFERENCE_PROPERTIES.has(property))
        case 'property':
            return ANIMATION_REFERENCE_PROPERTIES.has(emit.property)
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

function addMapValue<Key, Value>(map: Map<Key, Value[]>, key: Key, value: Value) {
    const values = map.get(key)
    if (values) {
        values.push(value)
    } else {
        map.set(key, [value])
    }
}

function collectClassEntries(css: MasterCSS) {
    const completionItems: ClassCompletionEntry[] = []
    const addedKeys = new Set<string>()
    const addedCompletionLabels = new Set<string>()
    const propertyCompletionItem = {
        kind: CompletionItemKind.Property,
        command: {
            title: 'triggerSuggest',
            command: 'editor.action.triggerSuggest'
        }
    }
    const addPropertyCompletionItem = (key: string, detail?: string) => {
        const label = key + ':'
        if (addedCompletionLabels.has(label)) return
        addedCompletionLabels.add(label)
        completionItems.push({
            ...propertyCompletionItem,
            ...(detail ? { detail } : {}),
            label,
            sortText: key
        })
    }
    const addSemanticCompletionItem = (label: string, detail?: string) => {
        if (addedCompletionLabels.has(label)) return
        addedCompletionLabels.add(label)
        completionItems.push({
            label,
            kind: CompletionItemKind.Value,
            documentationClassName: label,
            ...(detail ? { detail } : {})
        })
    }

    for (const eachDefinedUtility of css.definedUtilities) {
        if (eachDefinedUtility.type === UtilityType.Semantic) {
            const isComponent = eachDefinedUtility.layer === 'components'
            const { detail } = getUtilityInfo(eachDefinedUtility)
            for (const matcher of eachDefinedUtility.matchers) {
                if (matcher.type === 'static') {
                    addSemanticCompletionItem(matcher.name, isComponent ? 'component' : detail)
                } else if (matcher.type === 'pattern') {
                    for (const value of matcher.values) {
                        addSemanticCompletionItem(matcher.prefix + value, isComponent ? 'component' : undefined)
                    }
                }
            }
        } else {
            for (const matcher of eachDefinedUtility.matchers) {
                if (matcher.type !== 'pattern') continue
                for (const value of matcher.values) {
                    addSemanticCompletionItem(matcher.prefix + value)
                }
            }
            eachDefinedUtility.keys?.forEach(key => {
                addedKeys.delete(key)
                addPropertyCompletionItem(key)
            })

            if (eachDefinedUtility.aliasGroups?.length) {
                for (const aliasGroup of eachDefinedUtility.aliasGroups) {
                    if (addedKeys.has(aliasGroup)) {
                        continue
                    }
                    addedKeys.add(aliasGroup)
                }
            }
        }
    }

    for (const [key, canonicalKey] of Object.entries(builtinKeyAliases)) {
        addPropertyCompletionItem(key, canonicalKey)
    }

    for (const namespace of builtinNativeValueNamespaces) {
        for (const property of namespace.properties) {
            addPropertyCompletionItem(property)
        }
    }

    addedKeys.forEach(aliasGroup => {
        /**
         * Ambiguous keys are added to the completion list
         * @example text: t:
         */
        if (addedCompletionLabels.has(aliasGroup + ':')) return
        completionItems.push({
            ...propertyCompletionItem,
            detail: 'ambiguous key',
            label: aliasGroup + ':',
            sortText: aliasGroup
        })
    })

    return sortCompletionItems(completionItems)
}

function createPseudoClassSelectors(css: MasterCSS) {
    const selectors = new Map<string, string>([[':of', ':of']])
    for (const variant of css.manifest.variants || []) {
        const selector = variant.branches.find((branch) => branch.selector)?.selector
        if (selector && variant.token.startsWith(':') && !variant.token.startsWith('::')) {
            selectors.set(variant.token, selector)
        }
    }
    return Array.from(selectors, ([token, selector]) => ({ token, selector }))
}

function createPseudoElementSelectors(css: MasterCSS) {
    const selectors: SelectorVariantCandidate[] = []
    for (const variant of css.manifest.variants || []) {
        const selector = variant.branches.find((branch) => branch.selector)?.selector
        if (selector && variant.token.startsWith('::')) {
            selectors.push({ token: variant.token, selector })
        }
    }
    return selectors
}

function createNativeVariableNamespacesByProperty() {
    const namespacesByProperty = new Map<string, string[]>()
    for (const namespace of builtinNativeValueNamespaces) {
        const variableNamespaces = (namespace.variableAliasRefs || [])
            .map((ref) => ref[0] === '=' || ref[0] === '~' ? ref.slice(1) : '')
            .filter(Boolean)
        if (!variableNamespaces.length) continue
        for (const property of namespace.properties) {
            const namespaces = namespacesByProperty.get(property)
            if (namespaces) {
                namespaces.push(...variableNamespaces)
            } else {
                namespacesByProperty.set(property, [...variableNamespaces])
            }
        }
    }
    return namespacesByProperty
}

export function createCompletionIndex(css: MasterCSS = createDefaultCSS()): CompletionIndex {
    const componentNames: string[] = []
    const utilityNames: string[] = []
    const nativeUtilityKeys = new Map<string, string>()
    const scopedVariablesByKey = new Map<string, ScopedVariableCandidate[]>()
    const patternValuesByKey = new Map<string, PatternValueCandidate[]>()
    const animationUtilitiesByKey = new Map<string, AnimationUtilityCandidate[]>()

    for (const utility of css.definedUtilities) {
        const staticNames = utility.type === UtilityType.Semantic ? utilityNames : undefined
        for (const matcher of utility.matchers) {
            if (matcher.type === 'static') {
                staticNames?.push(matcher.name)
                if (utility.type === UtilityType.Semantic && utility.layer === 'components') {
                    componentNames.push(matcher.name)
                }
            } else if (matcher.type === 'pattern') {
                const patternNames = matcher.values.map((value) => matcher.prefix + value)
                utilityNames.push(...patternNames)
                if (utility.type === UtilityType.Semantic && utility.layer === 'components') {
                    componentNames.push(...patternNames)
                }
                if (matcher.prefix.endsWith(':')) {
                    const key = matcher.prefix.slice(0, -1)
                    for (const value of matcher.values) {
                        addMapValue(patternValuesByKey, key, { value })
                    }
                }
            }
        }

        for (const key of utility.keys || []) {
            if (!nativeUtilityKeys.has(key)) {
                nativeUtilityKeys.set(key, utility.emit.type === 'property' ? utility.emit.property : utility.id)
            }
        }

        if (utility.variables?.size) {
            const keys = new Set([
                utility.key,
                utility.subkey,
                ...(utility.keys || []),
                ...(utility.aliasGroups || [])
            ].filter((key): key is string => Boolean(key)))
            for (const key of keys) {
                utility.variables.forEach((variable, name) => {
                    addMapValue(scopedVariablesByKey, key, { name, variable })
                })
            }
        }

        if (utility.keys?.length && utilityMayReferenceAnimations(utility)) {
            const detailPrefix = isPureNativePropertyUtility(utility) ? utility.id : undefined
            for (const key of utility.keys) {
                addMapValue(animationUtilitiesByKey, key, { detailPrefix })
            }
        }
    }

    return {
        classEntries: collectClassEntries(css),
        componentNames,
        utilityNames,
        nativeUtilityKeys,
        scopedVariablesByKey,
        patternValuesByKey,
        animationUtilitiesByKey,
        nativeVariableNamespacesByProperty: createNativeVariableNamespacesByProperty(),
        variables: Array.from(css.variables.values()),
        pseudoClassNames: getMdnPseudoClassNames(),
        pseudoClassSelectors: createPseudoClassSelectors(css),
        pseudoElementNames: getMdnPseudoElementNames(),
        pseudoElementSelectors: createPseudoElementSelectors(css),
        atRules: Array.from(css.atRules.entries())
    }
}

export function matchesIndexedName(field: string, name: string) {
    if (!field.startsWith(name)) return false
    const nextCharacter = field.charAt(name.length)
    if (nextCharacter === '_') return true
    const lastCharacter = name.charAt(name.length - 1)
    const lastIsWord = /\w/.test(lastCharacter)
    const nextIsWord = /\w/.test(nextCharacter)
    return lastIsWord !== nextIsWord
}
