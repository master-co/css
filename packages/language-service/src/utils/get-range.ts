import { TextDocument, Range } from 'vscode-languageserver-textdocument'

export default function getRange(searchString: string, doc: TextDocument): Range | undefined {
    const offset = doc.getText().indexOf(searchString)
    if (offset === -1) { return }
    return {
        start: doc.positionAt(offset),
        end: doc.positionAt(offset + searchString.length)
    }
}