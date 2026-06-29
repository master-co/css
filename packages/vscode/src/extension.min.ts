import path from 'path'
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import { commands, Disposable, EventEmitter, ExtensionContext, languages, ProgressLocation, Range, SemanticTokens, SemanticTokensLegend, TextEdit, window, workspace, type CancellationToken, type FormattingOptions, type OutputChannel, type Position, type ProviderResult, type TextDocument } from 'vscode'
import { ACTIVE_SEMANTIC_TOKENS_REQUEST, DOCUMENT_SEMANTIC_TOKENS_REQUEST, settings, type Settings } from '@master/css-language-server'
import { applyMasterCSSDirectiveFormatEdits, formatMasterCSSDirectives, SEMANTIC_TOKENS_LEGEND } from '@master/css-language'
import { isCompatibleMasterCSSPackageVersion, resolveMasterCSSWorkspacePackages } from '@master/css-project/workspace'

let client: LanguageClient
let outputChannel: OutputChannel

const disposables: Disposable[] = []

type DocumentSelector = { scheme: string, language: string }[]
interface LSPSemanticTokens {
    data: number[]
}

const CSS_SEMANTIC_TOKEN_LANGUAGE_IDS = new Set(['css', 'scss', 'less'])
const CSS_FORMAT_LANGUAGE_IDS = new Set(['css', 'scss', 'less'])
let formattingDelegationDepth = 0

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

function log(message: string) {
    outputChannel?.appendLine(message)
    console.log(`[Master CSS] ${message}`)
}

function getBundledLanguageServerVersion(context: ExtensionContext) {
    const packageJSON = context.extension.packageJSON as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
        version?: string
    }
    return packageJSON.dependencies?.['@master/css-language-server']
        ?? packageJSON.devDependencies?.['@master/css-language-server']
        ?? packageJSON.version
}

function resolveWorkspaceServerModule(context: ExtensionContext, bundledServerModule: string) {
    const workspaceFolders = workspace.workspaceFolders?.filter((folder) => folder.uri.scheme === 'file') ?? []
    if (!workspaceFolders.length) {
        log(`Using bundled language server: ${bundledServerModule}`)
        return bundledServerModule
    }

    const bundledVersion = getBundledLanguageServerVersion(context)
    const resolvedServers: string[] = []
    for (const workspaceFolder of workspaceFolders) {
        const resolution = resolveMasterCSSWorkspacePackages(workspaceFolder.uri.fsPath)
        const languageServer = resolution.languageServer
        if (!languageServer) {
            log(`Using bundled language server because ${workspaceFolder.uri.fsPath} does not resolve @master/css-language-server/server.`)
            resolution.errors.forEach(({ name, message }) => log(`Workspace package resolution warning for ${name}: ${message}`))
            return bundledServerModule
        }
        if (!isCompatibleMasterCSSPackageVersion(languageServer.version, bundledVersion)) {
            log(`Using bundled language server because ${workspaceFolder.uri.fsPath} resolves incompatible @master/css-language-server ${languageServer.version ?? '(unknown version)'}.`)
            return bundledServerModule
        }
        resolvedServers.push(path.resolve(languageServer.entry))
        log(`Resolved workspace language server ${languageServer.version ?? '(unknown version)'} for ${workspaceFolder.uri.fsPath}: ${languageServer.entry}`)
    }

    const uniqueServerModules = [...new Set(resolvedServers)]
    if (uniqueServerModules.length === 1) {
        log(`Using workspace language server: ${uniqueServerModules[0]}`)
        return uniqueServerModules[0]
    }

    log(`Using bundled language server because workspace folders resolve different language server modules.`)
    return bundledServerModule
}

function getEmbeddedSyntaxHighlighting(): NonNullable<Settings['embeddedSyntaxHighlighting']> {
    const mode = getMasterCSSSettings().embeddedSyntaxHighlighting
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

function isCSSSemanticTokenDocument(document: TextDocument) {
    return CSS_SEMANTIC_TOKEN_LANGUAGE_IDS.has(document.languageId)
}

function isCSSFormattingDocument(document: TextDocument) {
    return CSS_FORMAT_LANGUAGE_IDS.has(document.languageId)
}

function getFullDocumentRange(document: TextDocument) {
    const lastLine = document.lineAt(document.lineCount - 1)
    return new Range(0, 0, lastLine.lineNumber, lastLine.text.length)
}

function applyTextEdits(document: TextDocument, edits: readonly TextEdit[]) {
    return [...edits]
        .sort((a, b) => document.offsetAt(b.range.start) - document.offsetAt(a.range.start))
        .reduce((text, edit) => {
            const start = document.offsetAt(edit.range.start)
            const end = document.offsetAt(edit.range.end)
            return text.slice(0, start) + edit.newText + text.slice(end)
        }, document.getText())
}

function formatDirectiveText(text: string) {
    return applyMasterCSSDirectiveFormatEdits(text, formatMasterCSSDirectives(text))
}

function createDirectiveTextEdits(document: TextDocument, range?: Range) {
    const source = document.getText()
    const offsetRange = range
        ? {
            start: document.offsetAt(range.start),
            end: document.offsetAt(range.end)
        }
        : undefined
    return formatMasterCSSDirectives(source, { range: offsetRange }).map((edit) => TextEdit.replace(
        new Range(document.positionAt(edit.start), document.positionAt(edit.end)),
        edit.newText
    ))
}

async function getDelegatedDocumentFormattingEdits(document: TextDocument, options: FormattingOptions) {
    formattingDelegationDepth++
    try {
        return await commands.executeCommand<TextEdit[]>('vscode.executeFormatDocumentProvider', document.uri, options) ?? []
    } finally {
        formattingDelegationDepth--
    }
}

async function provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken,
    next: (document: TextDocument, options: FormattingOptions, token: CancellationToken) => ProviderResult<TextEdit[]>
): Promise<TextEdit[]> {
    if (formattingDelegationDepth) return []
    if (!getMasterCSSSettings().formatDirectives) return []
    if (!isCSSFormattingDocument(document)) return await next(document, options, token) ?? []

    const delegatedEdits = await getDelegatedDocumentFormattingEdits(document, options)
    if (token.isCancellationRequested) return []
    const nativeFormattedText = delegatedEdits.length ? applyTextEdits(document, delegatedEdits) : document.getText()
    const formattedText = formatDirectiveText(nativeFormattedText)
    if (formattedText === document.getText()) return []
    return [TextEdit.replace(getFullDocumentRange(document), formattedText)]
}

async function provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    options: FormattingOptions,
    token: CancellationToken,
    next: (document: TextDocument, range: Range, options: FormattingOptions, token: CancellationToken) => ProviderResult<TextEdit[]>
): Promise<TextEdit[]> {
    if (formattingDelegationDepth) return []
    if (!getMasterCSSSettings().formatDirectives) return []
    if (!isCSSFormattingDocument(document)) return await next(document, range, options, token) ?? []
    return createDirectiveTextEdits(document, range)
}

function createSemanticTokensFeature(client: LanguageClient, clientStarted: Thenable<void>, documentSelector: DocumentSelector) {
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
        if (getEmbeddedSyntaxHighlighting() !== 'active') {
            resetActivePosition()
            changed.fire()
            return
        }
        const editor = window.activeTextEditor
        if (!editor || !isSelectedDocument(editor.document, documentSelector) || isCSSSemanticTokenDocument(editor.document)) {
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
        if (getEmbeddedSyntaxHighlighting() === 'always') {
            changed.fire()
            return
        }
        providerDisposable = languages.registerDocumentSemanticTokensProvider(documentSelector, {
            onDidChangeSemanticTokens: changed.event,
            async provideDocumentSemanticTokens(document, token) {
                const mode = getEmbeddedSyntaxHighlighting()
                const cssDocument = isCSSSemanticTokenDocument(document)
                const position = activePosition
                if (
                    token.isCancellationRequested
                    || mode === 'always'
                    || (!cssDocument && (
                        mode !== 'active'
                        || document.uri.toString() !== activeDocumentUri
                        || document.version !== activeDocumentVersion
                        || !position
                    ))
                ) {
                    return empty
                }
                await clientStarted
                if (token.isCancellationRequested) return empty
                try {
                    const semanticTokens = await client.sendRequest<LSPSemanticTokens>(cssDocument ? DOCUMENT_SEMANTIC_TOKENS_REQUEST : ACTIVE_SEMANTIC_TOKENS_REQUEST, {
                        textDocument: {
                            uri: document.uri.toString()
                        },
                        ...(!cssDocument && position
                            ? {
                                position: {
                                    line: position.line,
                                    character: position.character
                                }
                            }
                            : undefined)
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
            else if (isCSSSemanticTokenDocument(event.document)) changed.fire()
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
    outputChannel = window.createOutputChannel('Master CSS')
    context.subscriptions.push(outputChannel)

    // The server is implemented in node
    const bundledServerModule = context.asAbsolutePath(path.join('dist', 'server.min.js'))
    const serverModule = resolveWorkspaceServerModule(context, bundledServerModule)
    log(`Loading server from ${serverModule}`)

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
        middleware: {
            provideDocumentFormattingEdits,
            provideDocumentRangeFormattingEdits
        },
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
    const semanticTokensFeature = createSemanticTokensFeature(client, clientStarted, documentSelector)

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
        semanticTokensFeature,
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
                semanticTokensFeature.configure()
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
