import { TextDocumentSyncKind, ServerCapabilities } from 'vscode-languageserver'
import { AT_SIGN, SELECTOR_SIGNS } from '@master/css/common'

export const TRIGGER_CHARACTERS = {
    /**
     * First call to trigger syntax hints
     */
    invoked: ['"', ' ', '\''],
    /**
     * Trigger selector hints
     */
    selector: SELECTOR_SIGNS,
    /**
     * Trigger at hints
     */
    at: [AT_SIGN]
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