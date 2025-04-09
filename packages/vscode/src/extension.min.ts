import path from 'path'
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import { commands, ExtensionContext, ProgressLocation, window, workspace } from 'vscode'
import { settings } from '@master/css-language-server'

let client: LanguageClient

const disposables: Disposable[] = []

export function activate(context: ExtensionContext) {

    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('dist', 'server.min.cjs'))
    console.log('Loading server from ', serverModule)

    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6012'] }

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

    const includedLanguages = workspace.getConfiguration('masterCSS').includedLanguages as string[]
    const Languages: { scheme: string, language: string }[] = []
    includedLanguages.forEach((language) => {
        Languages.push(
            { scheme: 'file', language },
            { scheme: 'untitled', language }
        )
    })

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for documents
        documentSelector: Languages,
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        }
    }

    // Create the language client and start the client.
    client = new LanguageClient(
        'masterCSS',
        'Master CSS',
        serverOptions,
        clientOptions
    )

    // Start the client. This will also launch the server
    client.start()

    const restart = async (options = {
        title: 'Restarting Master CSS'
    }) => {
        await window.withProgress({
            location: ProgressLocation.Notification,
            title: options.title
        }, async (progress) => {
            await client.restart()
            const registeredCommands = await commands.getCommands(true)
            await Promise.all(registeredCommands.map(async (eachRegisteredCommand) => {
                if (eachRegisteredCommand === 'eslint.restart') {
                    await commands.executeCommand(eachRegisteredCommand)
                }
            }))
        })
    }

    context.subscriptions.push(
        commands.registerCommand('masterCSS.restart', restart),
        client.onRequest('masterCSS/restart', restart),
        workspace.onDidChangeConfiguration(async (event) => {
            const workspaceFolders = workspace.workspaceFolders ?? []
            const affectedProperties: string[] = []
            const shouldRestart = workspaceFolders?.some((folder) => {
                for (const optionName in settings) {
                    const property = `masterCSS.${optionName}`
                    if (event.affectsConfiguration(property, folder)) {
                        affectedProperties.push(property)
                        return true
                    }
                }
                return false
            })
            if (shouldRestart) {
                window.withProgress({
                    location: ProgressLocation.Notification,
                    title: `Setting "${affectedProperties}"`,
                }, async () => await client.restart())
                commands.executeCommand('eslint.restart')
            }
        }),
    )
}

export function deactivate(): Thenable<void> | undefined {
    unregisterProviders(disposables)

    if (!client) {
        return undefined
    }
    return client.stop()
}

function unregisterProviders(disposables: Disposable[]) {
    disposables.forEach(disposable => disposable?.[Symbol.dispose]())
    disposables.length = 0
}

function dedupe(arg0: any[]) {
    throw new Error('Function not implemented.')
}

