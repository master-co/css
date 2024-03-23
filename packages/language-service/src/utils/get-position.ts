import { TextDocument } from 'vscode-languageserver-textdocument'

export default function getPosition(searchString: string, text: string) {
    const document = TextDocument.create('mockuri://test', 'plaintext', 1, text)
    const offset = text.indexOf(searchString)
    const position = document.positionAt(offset)
    return position
}