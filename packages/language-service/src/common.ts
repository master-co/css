import { TextDocumentSyncKind, ServerCapabilities } from 'vscode-languageserver'

export const TRIGGER_CHARACTERS = {
    /**
     * First call to trigger syntax hints
     */
    invoked: ['"', ' ', '\''],
    /**
     * Trigger selector hints
     */
    selector: ['_', '>', ':'],
    /**
     * Trigger at hints
     */
    at: ['@']
}

export const SERVER_CAPABILITIES: ServerCapabilities = {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    // Tell the client that this server supports code completion.
    completionProvider: {
        resolveProvider: false,
        workDoneProgress: false,
        triggerCharacters: [
            ...TRIGGER_CHARACTERS.invoked,
            ...TRIGGER_CHARACTERS.selector,
            ...TRIGGER_CHARACTERS.at
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