import { TextDocumentSyncKind, ServerCapabilities } from 'vscode-languageserver'

export const triggerCharacters = {
    /**
     * First call to trigger syntax hints
     */
    invoked: ['"', ' ', '\''],
    /**
     * Trigger selector hints
     */
    selector: ['::', ':'],
    /**
     * Trigger at hints
     */
    at: ['@']
}

export const serverCapabilities: ServerCapabilities = {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    // Tell the client that this server supports code completion.
    completionProvider: {
        resolveProvider: false,
        workDoneProgress: false,
        triggerCharacters: [
            ...triggerCharacters.invoked,
            ...triggerCharacters.selector,
            ...triggerCharacters.at
        ],
    },
    colorProvider: true,
    hoverProvider: true,
    workspace: {
        workspaceFolders: {
            supported: true
        }
    }
}