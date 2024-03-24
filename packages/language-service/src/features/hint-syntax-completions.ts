import type { CompletionItem, CompletionParams } from 'vscode-languageserver'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'
import CSSLanguageService from '../core'
import querySyntaxCompletions from '../utils/query-syntax-completions'
import { TRIGGER_CHARACTERS } from '../common'
import getRuleKeyCompletionItems from '../utils/get-rule-key-completion-items'

export default function hintSyntaxCompletions(this: CSSLanguageService,
    document: TextDocument,
    position: CompletionParams['position'],
    context: CompletionParams['context']
): CompletionItem[] | undefined {
    const language = document.uri.substring(document.uri.lastIndexOf('.') + 1)
    const checkResult = this.getPosition(document, position)
    const triggerCharacter = context?.triggerCharacter
    const triggerKind = context?.triggerKind
    const invoked = TRIGGER_CHARACTERS.invoked.includes(triggerCharacter || '')
    const token = checkResult?.token
    // todo: trigger getRuleCompletionItems() on invoked
    if (invoked && !token) {
        return getRuleKeyCompletionItems(triggerCharacter, this.css)
    } else if (checkResult || invoked) {
        return querySyntaxCompletions(token || '', this.css)
    }
    // todo
    // else if (isInstance === true && checkConfigColorsBlock(document, position) === true) {
    //     return getColorCompletionItems(this.css)
    // }
}

// temporary
export function checkConfigColorsBlock(document: TextDocument, position: Position) {
    const lineText: string = (document?.getText({
        start: { line: position.line, character: 0 },
        end: { line: position.line, character: position.character },
    }) ?? '').trim()

    if ((lineText.match(/'|"|`/g)?.length ?? 0) % 2 === 0) {
        return false
    }
    for (let i = position.line; i > 0; i--) {
        const text = document.getText({
            start: {
                line: i - 1,
                character: 0
            },
            end: {
                line: i,
                character: 0
            }
        })
        if (text.includes('}')) {
            return false
        } else if (text.includes('colors:')) {
            return true
        }
    }
    return false
}

