import path from 'path'
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import { commands, Disposable, EventEmitter, ExtensionContext, languages, Position, ProgressLocation, SemanticTokens, SemanticTokensLegend, TextDocument, window, workspace } from 'vscode'
import { ACTIVE_SEMANTIC_TOKENS_REQUEST, settings, type Settings } from '@master/css-language-server'
import { SEMANTIC_TOKENS_LEGEND } from '@master/css-language-service'
import type { SemanticTokens as LSPSemanticTokens } from 'vscode-languageserver-protocol'

let client: LanguageClient

const disposables: Disposable[] = []

type DocumentSelector = { scheme: string, language: string }[]

function getMasterCSSSettings(): Partial<Settings> {
    const configuration = workspace.getConfiguration('masterCSS')
    const result: Partial<Settings> = {}
    const writableResult = result as Record<string, unknown>
    for (const optionName in settings) {
        const value = configuration.get(optionName)
        if (value !== undefined) {
            writableResult[optionName] = value
        }
    }
    return result
}

function getIncludedLanguages() {
    return getMasterCSSSettings().includedLanguages ?? settings.includedLanguages ?? []
}

function getSyntaxHighlighting(): NonNullable<Settings['syntaxHighlighting']> {
    const mode = getMasterCSSSettings().syntaxHighlighting
    return mode === 'always' || mode === 'off' ? mode : 'active'
}

function createDocumentSelector(): DocumentSelector {
    return getIncludedLanguages().flatMap((language) => [
        { scheme: 'file', language },
        { scheme: 'untitled', language }
    ])
}

function isSelectedDocument(document: TextDocument, documentSelector: DocumentSelector) {
    return documentSelector.some(({ scheme, language }) => document.uri.scheme === scheme && document.languageId === language)
}

function createActiveSemanticTokensFeature(client: LanguageClient, clientStarted: Thenable<void>, documentSelector: DocumentSelector) {
    const changed = new EventEmitter<void>()
    const legend = new SemanticTokensLegend(
        SEMANTIC_TOKENS_LEGEND.tokenTypes,
        SEMANTIC_TOKENS_LEGEND.tokenModifiers
    )
    const empty = new SemanticTokens(new Uint32Array())
    const ownedDisposables: Disposable[] = [changed]
    let providerDisposable: Disposable | undefined
    let activeDocumentUri: string | undefined
    let activeDocumentVersion: number | undefined
    let activePosition: Position | undefined

    const resetActivePosition = () => {
        activeDocumentUri = undefined
        activeDocumentVersion = undefined
        activePosition = undefined
    }

    const updateActivePosition = () => {
        if (getSyntaxHighlighting() !== 'active') {
            resetActivePosition()
            changed.fire()
            return
        }
        const editor = window.activeTextEditor
        if (!editor || !isSelectedDocument(editor.document, documentSelector)) {
            resetActivePosition()
            changed.fire()
            return
        }
        activeDocumentUri = editor.document.uri.toString()
        activeDocumentVersion = editor.document.version
        activePosition = editor.selection.active
        changed.fire()
    }

    const registerProvider = () => {
        providerDisposable?.dispose()
        providerDisposable = undefined
        resetActivePosition()
        if (getSyntaxHighlighting() !== 'active') {
            changed.fire()
            return
        }
        providerDisposable = languages.registerDocumentSemanticTokensProvider(documentSelector, {
            onDidChangeSemanticTokens: changed.event,
            async provideDocumentSemanticTokens(document, token) {
                const position = activePosition
                if (
                    token.isCancellationRequested
                    || getSyntaxHighlighting() !== 'active'
                    || document.uri.toString() !== activeDocumentUri
                    || document.version !== activeDocumentVersion
                    || !position
                ) {
                    return empty
                }
                await clientStarted
                if (token.isCancellationRequested) return empty
                try {
                    const semanticTokens = await client.sendRequest<LSPSemanticTokens>(ACTIVE_SEMANTIC_TOKENS_REQUEST, {
                        textDocument: {
                            uri: document.uri.toString()
                        },
                        position: {
                            line: position.line,
                            character: position.character
                        }
                    })
                    return new SemanticTokens(Uint32Array.from(semanticTokens.data))
                } catch {
                    return empty
                }
            }
        }, legend)
        updateActivePosition()
    }

    ownedDisposables.push(
        window.onDidChangeActiveTextEditor(updateActivePosition),
        window.onDidChangeTextEditorSelection(updateActivePosition),
        workspace.onDidChangeTextDocument((event) => {
            if (event.document.uri.toString() === activeDocumentUri) updateActivePosition()
        }),
        {
            dispose: () => providerDisposable?.dispose()
        }
    )

    registerProvider()

    return {
        configure: registerProvider,
        dispose() {
            ownedDisposables.forEach((disposable) => disposable.dispose())
            ownedDisposables.length = 0
        }
    }
}

export function activate(context: ExtensionContext) {

    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('dist', 'server.min.mjs'))
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

    const documentSelector = createDocumentSelector()

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for documents
        documentSelector,
        initializationOptions: () => ({
            masterCSS: getMasterCSSSettings()
        }),
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
    const clientStarted = client.start()
    const activeSemanticTokensFeature = createActiveSemanticTokensFeature(client, clientStarted, documentSelector)

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
        activeSemanticTokensFeature,
        commands.registerCommand('masterCSS.restart', restart),
        client.onRequest('masterCSS/restart', restart),
        workspace.onDidChangeConfiguration(async (event) => {
            const affectedProperties: string[] = []
            let shouldRestart = false
            for (const optionName in settings) {
                const property = `masterCSS.${optionName}`
                if (event.affectsConfiguration(property)) {
                    affectedProperties.push(property)
                    shouldRestart = true
                }
            }
            if (shouldRestart) {
                activeSemanticTokensFeature.configure()
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
    disposables.forEach(disposable => disposable.dispose())
    disposables.length = 0
}
