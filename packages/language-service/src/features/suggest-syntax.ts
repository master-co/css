import type { CompletionItem, CompletionParams } from 'vscode-languageserver-protocol'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import CSSLanguageService from '../core'
import querySyntaxCompletions from '../utils/query-syntax-completions'
import type { CompletionIndex } from '../utils/completion-index'

export default function suggestSyntax(this: CSSLanguageService,
  document: TextDocument,
  position: CompletionParams['position'],
  context: CompletionParams['context'],
  completionIndex?: CompletionIndex
): CompletionItem[] | undefined {
  const classPosition = this.getClassPosition(document, position)
  if (classPosition !== undefined) {
    const q = context?.triggerCharacter === ' '
      /**
       * When the last trigger character is " " and classPosition exists,
       * it means the user is preparing to enter the next class.
       * @example <div class="class-a "></div>
       *                              ^ cursor is here
       * */
      ? ''
      /**
       * Get the front field of the class according to the cursor.
       * @example <div class="text-center:hover@sm"></div>
       *                          ^ types: and cursor is here -> text:
       * */
      : document.getText({
        start: document.positionAt(classPosition.range.start),
        end: position
      })
    return querySyntaxCompletions(q, this.css, completionIndex)
  }
  // todo
  // else if (isInstance === true && checkConfigColorsBlock(document, position) === true) {
  //     return getColorCompletionItems(this.css)
  // }
}
