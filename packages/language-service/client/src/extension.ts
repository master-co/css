import * as path from 'path'
import { workspace, ExtensionContext, Disposable } from 'vscode'

import {
    DocumentSelector,
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node'
import * as vscode from 'vscode'

let client: LanguageClient

const disposables: Disposable[] = []

export function activate(context: ExtensionContext) {

    // The server is implemented in node
    const serverModule = context.asAbsolutePath(
        path.join('server', 'out', 'server.js')
    )
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] }

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    }


    const langs = vscode.workspace.getConfiguration('masterCSS').languages


    const Languages: { scheme: 'file', language: string }[] = []
    langs.forEach(x => {
        Languages.push({ scheme: 'file', language: x })
    })

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for html documents
        documentSelector: Languages,
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        }
    }

    // Create the language client and start the client.
    client = new LanguageClient(
        'masterCss',
        'Master CSS',
        serverOptions,
        clientOptions
    )

    // Start the client. This will also launch the server
    client.start()
}

export function deactivate(): Thenable<void> | undefined {
    unregisterProviders(disposables)

    if (!client) {
        return undefined
    }
    return client.stop()
}

function unregisterProviders(disposables: Disposable[]) {
    disposables.forEach(disposable => disposable.dispose())
    disposables.length = 0
}
function dedupe(arg0: any[]) {
    throw new Error('Function not implemented.')
}

