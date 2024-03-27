import type { CompletionItem } from 'vscode-languageserver'
import getPseudoClassCompletionItems from './get-pseudo-class-completion-items'
import getPseudoElementCompletionItems from './get-pseudo-element-completion-items'
import { MasterCSS } from '@master/css'
import { TRIGGER_CHARACTERS } from '../common'
import getMainCompletionItems from './get-main-completion-items'
import { AT_SIGN, SELECTOR_SIGNS } from '@master/css/common'
import getValueCompletionItems from './get-value-completion-items'

export default function querySyntaxCompletions(q = '', css: MasterCSS = new MasterCSS()) {
    const fields = q.split(' ')
    const field = fields[fields.length - 1]
    const triggerCharacter = q.charAt(q.length - 1)
    const completionItems: CompletionItem[] = []
    const invoked = triggerCharacter === ' ' || field.length === 0
    if (invoked) {
        return getMainCompletionItems(css)
    }
    const subFields = field.split(':')
    const fieldBeforeFirstColon = subFields[0]
    const styleNames = Object.keys(css.config.styles || {})
    const utilityNames = Object.keys(css.config.utilities || {})
    const isStyle = styleNames.includes(fieldBeforeFirstColon)
    const isUtility = utilityNames.includes(fieldBeforeFirstColon)
    // check by utilities and styles
    let keyCompleted = isStyle || isUtility
    const valueCompleted = keyCompleted
    if (!keyCompleted) {
        keyCompleted = new RegExp(`[${SELECTOR_SIGNS.join('') + AT_SIGN}]`).test(field.slice(1))
    }
    // todo: starts with $
    /**
     * The server capability sets '@' '~' as the trigger characters for at and adjacent selectors,
     * but these two characters are also the prefix symbols of `animation` and `transition`,
     * and should be filtered to prevent hints all completions items.
     * @example class="@"
     * @example class="~"
     */
    if (!keyCompleted && (field.startsWith('@') || field.startsWith('~'))) {
        return getMainCompletionItems(css)
            .filter(completionItem => completionItem.label.startsWith(field))
            .map((completionItem) => ({ ...completionItem, label: completionItem.label.slice(1) }))
    }
    if (!keyCompleted) {
        return getMainCompletionItems(css)
    }
    if (!valueCompleted && subFields[1] === '') {
        return getValueCompletionItems(subFields[0], css)
    }
    if (isStyle) return
    if (TRIGGER_CHARACTERS.selector.includes(triggerCharacter)) {
        if (field.endsWith('::')) {
            completionItems.push(...getPseudoElementCompletionItems(css, '::'))
        } else {
            completionItems.push(...getPseudoClassCompletionItems(css, ':'), ...getPseudoElementCompletionItems(css, '::'))
        }
    }
    return completionItems
}