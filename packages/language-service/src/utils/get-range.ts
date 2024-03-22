import { TextDocument, Range } from 'vscode-languageserver-textdocument'

export default function getRange(searchString: string, doc: TextDocument): Range {
    const offset = doc.getText().indexOf(searchString)
    if (offset === -1) {
        throw new Error(`Cannot find ${searchString} in ${doc.getText()}`)
    }
    return {
        start: doc.positionAt(offset),
        end: doc.positionAt(offset + searchString.length)
    }
}