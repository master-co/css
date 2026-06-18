import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import { UtilityType, MasterCSS, createDefaultCSS, generateCSS } from '../master-css'
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

    for (const eachDefinedUtility of css.definedUtilities) {
        if (eachDefinedUtility.type === UtilityType.Static) {
            const isComponent = eachDefinedUtility.layer === 'components'
            const { detail } = getUtilityInfo(eachDefinedUtility)
            const utilityName = eachDefinedUtility.id.slice(1)
            completionItems.push({
                label: utilityName,
                kind: CompletionItemKind.Value,
                documentation: createCSSMarkdownDocumentation(generateCSS([utilityName], css)),
                detail: isComponent ? 'component' : detail
            })
        } else {
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

    for (const [key, canonicalKey] of Object.entries(css.plan.keyAliases || {})) {
        addPropertyCompletionItem(key, canonicalKey)
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
