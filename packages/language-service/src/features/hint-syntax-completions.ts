import type { CompletionItem, CompletionParams } from 'vscode-languageserver'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'
import CSSLanguageService from '../core'
import querySyntaxCompletions from '../utils/query-syntax-completions'

export default function hintSyntaxCompletions(this: CSSLanguageService,
    document: TextDocument,
    position: CompletionParams['position'],
    context: CompletionParams['context']
): CompletionItem[] | undefined {
    const language = document.uri.substring(document.uri.lastIndexOf('.') + 1)
    const checkResult = this.getClassPosition(document, position)
    // todo: trigger getRuleCompletionItems() on invoked
    if (checkResult !== undefined)
        return querySyntaxCompletions(checkResult.token, this.css)
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

