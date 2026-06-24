import { CompletionItemKind, type CompletionItem } from 'vscode-languageserver-protocol'
import getPseudoClassCompletionItems from './get-pseudo-class-completion-items'
import getPseudoElementCompletionItems from './get-pseudo-element-completion-items'
import { AT_SIGN, MasterCSS, createDefaultCSS, QUERY_COMPARISON_OPERATORS, QUERY_LOGICAL_OPERATORS, SELECTOR_SIGNS, generateCSS } from '@master/css-language'
import { GROUP_TRIGGER_CHARACTER, SELECTOR_TRIGGER_CHARACTERS } from '../common'
import getClassCompletionItems from './get-class-completion-items'
import getValueCompletionItems from './get-value-completion-items'
import getQueryCompletionItems from './get-query-completion-items'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import { createCompletionIndex, matchesIndexedName, type CompletionIndex } from './completion-index'

export default function querySyntaxCompletions(q = '', css: MasterCSS = createDefaultCSS(), completionIndex: CompletionIndex = createCompletionIndex(css)) {
    const fields = q.split(' ')
    let field = fields[fields.length - 1]
    const triggerCharacter = q.charAt(q.length - 1)
    const invoked = triggerCharacter === ' ' || field.length === 0
    if (invoked || field === GROUP_TRIGGER_CHARACTER || triggerCharacter === ';') {
        return getClassCompletionItems(css, completionIndex)
    }
    const isGroup = field.startsWith(GROUP_TRIGGER_CHARACTER)
    if (isGroup) {
        const declarationSeparatorMatches = Array.from(field.matchAll(/;(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/g))
        if (declarationSeparatorMatches.length) {
            field = field.slice((declarationSeparatorMatches[declarationSeparatorMatches.length - 1] as RegExpExecArray).index + 1)
        } else {
            field = field.slice(1)
        }
    }
    if (field.startsWith(AT_SIGN) || field.startsWith('~')) {
        return []
    }
    const keyMatch = field.match(/^[^'":\s]+:/)
    const atMatches = Array.from(field.matchAll(/@(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/g))
    const valueSeparatorMatch = field.match(/\|(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/g)
    const atInvoked = atMatches.findIndex(({ index }) => index !== 0) !== -1
    const firstColonIndex = keyMatch ? keyMatch[0].length - 1 : -1
    const selectorInvokedRegex = new RegExp(`[${SELECTOR_SIGNS.join('')}](?=(?:[^'"]|'[^']*'|"[^"]*")*$)`)
    const key = keyMatch ? keyMatch[0].slice(0, firstColonIndex) : undefined
    const isStyle = completionIndex.componentNames.some((eachStyleName) => matchesIndexedName(field, eachStyleName))
    const isUtility = completionIndex.utilityNames.some((eachUtilityName) => matchesIndexedName(field, eachUtilityName))
    // check by utilities and components
    if (!isStyle && !isUtility) {
        if (key === undefined && !valueSeparatorMatch) {
            return getClassCompletionItems(css, completionIndex)
        }

        if (!atInvoked && !selectorInvokedRegex.test(field.slice(firstColonIndex + 1))) {
            if (key && firstColonIndex !== -1) {
                return getValueCompletionItems(css, key, field.slice(firstColonIndex + 1), completionIndex)
            }
        }
    }

    /**
     * Not support conditional btn:hover and group
     */
    if (isStyle || isGroup) return

    if (atInvoked && [AT_SIGN, ...QUERY_COMPARISON_OPERATORS, ...QUERY_LOGICAL_OPERATORS].includes(triggerCharacter)) {
        return getQueryCompletionItems(css, triggerCharacter, field, completionIndex)
    }

    if (!atInvoked && SELECTOR_TRIGGER_CHARACTERS.includes(triggerCharacter)) {
        const pseudoElementCompletionItems = getPseudoElementCompletionItems(css, field, completionIndex)
        if (field.endsWith('::')) {
            /**
             * Consider trigger characters and fix insertText.
             * @incorrect class="text-center::" -> class="text-center::::after"
             * @correct class="text-center::" -> class="text-center::after"
             */
            pseudoElementCompletionItems.forEach((completionItem) => completionItem.insertText = completionItem.label.slice(2))
            return pseudoElementCompletionItems
        } else {
            const completionItems: CompletionItem[] = getPseudoClassCompletionItems(css, field, completionIndex)
            completionItems.push(...pseudoElementCompletionItems)
            /**
             * Consider trigger characters and fix insertText.
             * @incorrect class="text-center:" -> class="text-center::active"
             * @correct class="text-center:" -> class="text-center:active"
             */
            if (triggerCharacter === ':') {
                completionItems.forEach((completionItem) => completionItem.insertText = completionItem.label.slice(1))
            } else {
                completionItems.push({
                    label: '.<class>',
                    insertText: '.',
                    documentation: createCSSMarkdownDocumentation(generateCSS([field + '.class'], css, completionIndex.runtime)),
                    kind: CompletionItemKind.Class
                })
            }
            return completionItems
        }

    }
}
