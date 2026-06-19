import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import { UtilityType, MasterCSS, createDefaultCSS, generateCSS } from '../master-css'
import { builtinKeyAliases, builtinNativeValueNamespaces } from '@master/css-engine'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import sortCompletionItems from './sort-completion-items'
import getUtilityInfo from './get-utility-info'

export default function getClassCompletionItems(css: MasterCSS = createDefaultCSS()): CompletionItem[] {
    const completionItems: CompletionItem[] = []
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
            documentation: createCSSMarkdownDocumentation(generateCSS([label], css)),
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
