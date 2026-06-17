import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import { UtilityType, MasterCSS, createDefaultCSS, generateCSS } from '../master-css'
import { getCSSDataDocumentation } from './get-css-data-documentation'
import sortCompletionItems from './sort-completion-items'
import getUtilityInfo from './get-utility-info'

export default function getClassCompletionItems(css: MasterCSS = createDefaultCSS()): CompletionItem[] {
    const completionItems: CompletionItem[] = []
    const addedKeys = new Set<string>()
    for (const eachDefinedUtility of css.definedUtilities) {
        if (eachDefinedUtility.type === UtilityType.Static) {
            const isComponent = eachDefinedUtility.layer === 'components'
            const { detail } = getUtilityInfo(eachDefinedUtility, css)
            const utilityName = eachDefinedUtility.id.slice(1)
            completionItems.push({
                label: utilityName,
                kind: CompletionItemKind.Value,
                documentation: getCSSDataDocumentation({
                    generatedCSS: generateCSS([utilityName], css)
                }),
                detail: isComponent ? 'component' : detail
            })
        } else {
            const eachCompletionItem = {
                kind: CompletionItemKind.Property,
            }

            eachDefinedUtility.keys?.forEach(key => {
                addedKeys.delete(key)
                completionItems.push({
                    ...eachCompletionItem,
                    label: key + ':',
                    sortText: key,
                    command: {
                        title: 'triggerSuggest',
                        command: 'editor.action.triggerSuggest'
                    }
                })
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

    addedKeys.forEach(aliasGroup => {
        /**
         * Ambiguous keys are added to the completion list
         * @example text: t:
         */
        completionItems.push({
            kind: CompletionItemKind.Property,
            detail: 'ambiguous key',
            label: aliasGroup + ':',
            sortText: aliasGroup,
            command: {
                title: 'triggerSuggest',
                command: 'editor.action.triggerSuggest'
            }
        })
    })

    return sortCompletionItems(completionItems)
}
