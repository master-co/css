import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import { SyntaxRuleType, MasterCSS, createCSS, generateCSS, isCoreRule } from '@master/css'
import { getCSSDataDocumentation } from './get-css-data-documentation'
import sortCompletionItems from './sort-completion-items'
import getUtilityInfo from './get-utility-info'
import cssDataProvider from './css-data-provider'

export default function getMainCompletionItems(css: MasterCSS = createCSS()): CompletionItem[] {
    const completionItems: CompletionItem[] = []
    const addedKeys = new Set<string>()
    for (const eachDefinedRule of css.definedRules) {
        if (eachDefinedRule.definition.type === SyntaxRuleType.Utility) {
            const { data, detail, docs } = getUtilityInfo(eachDefinedRule, css)
            const utilityName = eachDefinedRule.id.slice(1)
            completionItems.push({
                label: utilityName,
                kind: CompletionItemKind.Value,
                documentation: getCSSDataDocumentation(data, {
                    generatedCSS: generateCSS([utilityName], css),
                    docs
                }),
                detail
            })
        } else {
            const nativeProperties = cssDataProvider.provideProperties()
            const nativeCSSPropertyData = nativeProperties.find(({ name }) => name === eachDefinedRule.id)
            const eachCompletionItem = {
                kind: CompletionItemKind.Property,
                documentation: getCSSDataDocumentation(nativeCSSPropertyData, {
                    docs: '/reference/' + isCoreRule(eachDefinedRule.id) && eachDefinedRule.id
                }),
                detail: nativeCSSPropertyData?.syntax,
            }

            eachDefinedRule.keys.forEach(key => {
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
            if (eachDefinedRule.definition?.sign && eachDefinedRule.definition.includeAnimations) {
                css.animations.forEach((animation, animationName) => {
                    completionItems.push({
                        ...eachCompletionItem,
                        label: eachDefinedRule.definition.sign + animationName + '|1s',
                        kind: CompletionItemKind.Value
                    })
                })
            }

            if (eachDefinedRule.definition?.aliasGroups?.length) {
                for (const aliasGroup of eachDefinedRule.definition.aliasGroups) {
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

    if (css.config.components) {
        for (const componentClass in css.config.components) {
            const componentTokens = css.components.get(componentClass)
            if (!componentTokens) continue
            completionItems.push({
                label: componentClass,
                kind: CompletionItemKind.Value,
                documentation: getCSSDataDocumentation({} as any, {
                    generatedCSS: generateCSS([componentClass], css),
                    docs: '/guide/components'
                }),
                detail: componentTokens.join(' ') + ' (style)',
            })
        }
    }

    return sortCompletionItems(completionItems)
}