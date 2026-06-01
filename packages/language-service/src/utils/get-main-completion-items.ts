import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import { UtilityType, MasterCSS, createCSS } from '@master/css'
import { generateCSS, isCoreRule } from '@master/css/utils'
import { getCSSDataDocumentation } from './get-css-data-documentation'
import sortCompletionItems from './sort-completion-items'
import getUtilityInfo from './get-utility-info'
import cssDataProvider from './css-data-provider'

export default function getMainCompletionItems(css: MasterCSS = createCSS()): CompletionItem[] {
    const completionItems: CompletionItem[] = []
    const addedKeys = new Set<string>()
    for (const eachDefinedUtility of css.definedUtilities) {
        if (eachDefinedUtility.definition.type === UtilityType.Static) {
            const isMainStyle = eachDefinedUtility.definition.layer === 'main'
            const { data, detail, docs } = getUtilityInfo(eachDefinedUtility, css)
            const utilityName = eachDefinedUtility.id.slice(1)
            completionItems.push({
                label: utilityName,
                kind: CompletionItemKind.Value,
                documentation: getCSSDataDocumentation(data, {
                    generatedCSS: generateCSS([utilityName], css),
                    docs: isMainStyle ? '/guide/components' : docs
                }),
                detail: isMainStyle ? 'main style' : detail
            })
        } else {
            const nativeProperties = cssDataProvider.provideProperties()
            const nativeCSSPropertyData = nativeProperties.find(({ name }) => name === eachDefinedUtility.id)
            const eachCompletionItem = {
                kind: CompletionItemKind.Property,
                documentation: getCSSDataDocumentation(nativeCSSPropertyData, {
                    docs: '/reference/' + isCoreRule(eachDefinedUtility.id) && eachDefinedUtility.id
                }),
                detail: nativeCSSPropertyData?.syntax,
            }

            eachDefinedUtility.keys.forEach(key => {
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

            /**
             * @example @ animation and ~ transition
             */
            if (eachDefinedUtility.definition?.sign && eachDefinedUtility.definition.includeAnimations) {
                css.animations.forEach((animation, animationName) => {
                    completionItems.push({
                        ...eachCompletionItem,
                        label: eachDefinedUtility.definition.sign + animationName + '|1s',
                        kind: CompletionItemKind.Value
                    })
                })
            }

            if (eachDefinedUtility.definition?.aliasGroups?.length) {
                for (const aliasGroup of eachDefinedUtility.definition.aliasGroups) {
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
