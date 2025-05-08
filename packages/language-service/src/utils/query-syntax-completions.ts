import { CompletionItemKind, type CompletionItem } from 'vscode-languageserver-protocol'
import getPseudoClassCompletionItems from './get-pseudo-class-completion-items'
import getPseudoElementCompletionItems from './get-pseudo-element-completion-items'
import { ANIMATION_SIGN, AT_SIGN, MasterCSS, createCSS, QUERY_COMPARISON_OPERATORS, QUERY_LOGICAL_OPERATORS, TRANSITION_SIGN, generateCSS } from '@master/css'
import { GROUP_TRIGGER_CHARACTER, SELECTOR_TRIGGER_CHARACTERS } from '../common'
import getMainCompletionItems from './get-main-completion-items'
import { SELECTOR_SIGNS } from '@master/css'
import getValueCompletionItems from './get-value-completion-items'
import getQueryCompletionItems from './get-query-completion-items'
import { getCSSDataDocumentation } from './get-css-data-documentation'

export default function querySyntaxCompletions(q = '', css: MasterCSS = createCSS()) {
    const fields = q.split(' ')
    let field = fields[fields.length - 1]
    const triggerCharacter = q.charAt(q.length - 1)
    const invoked = triggerCharacter === ' ' || field.length === 0
    if (invoked || field === GROUP_TRIGGER_CHARACTER || triggerCharacter === ';') {
        return getMainCompletionItems(css)
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
    const signs = css.definedRules
        .filter(({ definition }) => definition.sign)
        .map(({ definition }) => definition.sign)
    const keyMatch = field.match(new RegExp(`^[^${signs}'":\\s]+:`))
    const atMatches = Array.from(field.matchAll(/@(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/g))
    const valueSeparatorMatch = field.match(/\|(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/g)
    const atInvoked = atMatches.findIndex(({ index }) => index !== 0) !== -1
    const firstColonIndex = keyMatch ? keyMatch[0].length - 1 : -1
    const selectorInvokedRegex = new RegExp(`[${SELECTOR_SIGNS.join('')}](?=(?:[^'"]|'[^']*'|"[^"]*")*$)`)
    const key = keyMatch ? keyMatch[0].slice(0, firstColonIndex) : undefined
    const componentNames = Object.keys(css.config.components || {})
    const utilityNames = Object.keys(css.config.utilities || {})
    const isStyle = !!componentNames.find((eachStyleName) => new RegExp(`^${eachStyleName}(?:\\b|_)`).test(field))
    const isUtility = !!utilityNames.find((eachUtilityName) => new RegExp(`^${eachUtilityName}(?:\\b|_)`).test(field))

    // check by utilities and components
    if (!isStyle && !isUtility) {
        if (key === undefined && !valueSeparatorMatch) {
            /**
             * The server capability sets '@' '~' as the trigger characters for at and adjacent selectors,
             * but these two characters are also the prefix symbols of `animation` and `transition`,
             * and should be filtered to prevent hints all completions items.
             * @example class="@"
             * @example class="~"
             */
            if (field.startsWith(ANIMATION_SIGN) || field.startsWith(TRANSITION_SIGN)) {
                return getMainCompletionItems(css)
                    .filter(completionItem => completionItem.label.startsWith(field))
                    .map((completionItem) => ({ ...completionItem, label: completionItem.label.slice(1) }))
            }
            return getMainCompletionItems(css)
        }

        if (!atInvoked && !selectorInvokedRegex.test(field.slice(firstColonIndex + 1))) {
            if (field.startsWith(ANIMATION_SIGN) && firstColonIndex === -1) {
                return getValueCompletionItems(css, 'animation')
            } else if (field.startsWith(TRANSITION_SIGN) && firstColonIndex === -1) {
                return getValueCompletionItems(css, 'transition')
            } else if (key && firstColonIndex !== -1) {
                return getValueCompletionItems(css, key)
            }
        }
    }

    /**
     * Not support conditional btn:hover and group
     */
    if (isStyle || isGroup) return

    if (atInvoked && [AT_SIGN, ...QUERY_COMPARISON_OPERATORS, ...QUERY_LOGICAL_OPERATORS].includes(triggerCharacter)) {
        return getQueryCompletionItems(css, triggerCharacter, field)
    }

    if (!atInvoked && SELECTOR_TRIGGER_CHARACTERS.includes(triggerCharacter)) {
        const pseudoElementCompletionItems = getPseudoElementCompletionItems(css, field)
        if (field.endsWith('::')) {
            /**
             * Consider trigger characters and fix insertText.
             * @incorrect class="text:center::" -> class="text:center::::after"
             * @correct class="text:center::" -> class="text:center::after"
             */
            pseudoElementCompletionItems.forEach((completionItem) => completionItem.insertText = completionItem.label.slice(2))
            return pseudoElementCompletionItems
        } else {
            const completionItems: CompletionItem[] = getPseudoClassCompletionItems(css, field)
            completionItems.push(...pseudoElementCompletionItems)
            /**
             * Consider trigger characters and fix insertText.
             * @incorrect class="text:center:" -> class="text:center::active"
             * @correct class="text:center:" -> class="text:center:active"
             */
            if (triggerCharacter === ':') {
                completionItems.forEach((completionItem) => completionItem.insertText = completionItem.label.slice(1))
            } else {
                completionItems.push({
                    label: '.<class>',
                    insertText: '.',
                    documentation: getCSSDataDocumentation(undefined, {
                        generatedCSS: generateCSS([field + '.class'], css),
                        docs: '/guide/selectors'
                    }),
                    kind: CompletionItemKind.Class
                })
            }
            return completionItems
        }

    }
}