import { createConnection, TextDocuments, ProposedFeatures, InitializeParams, DidChangeConfigurationNotification, CompletionItem, TextDocumentSyncKind, InitializeResult } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import path from 'path'
import { fileURLToPath } from 'url'
import CSSLanguageService from '@master/css-language-service'

export default function serve() {
    const workspaceLanguageService: Record<string, CSSLanguageService> = {}
    const connection = createConnection(ProposedFeatures.all)
    const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

    let hasConfigurationCapability = false
    let hasWorkspaceFolderCapability = false

    async function createLanguageService(workspaceURI: string) {
        console.log('Create a language service for', workspaceURI)
        const cwd = fileURLToPath(workspaceURI.replace('%3A', ':'))
        const settings = await connection.workspace.getConfiguration({
            scopeUri: workspaceURI,
            section: 'masterCSS'
        })
        return new CSSLanguageService({ settings, cwd })
    }

    // find the workspace language service for the given uri
    function findCurrentLanguageService(uri: string): CSSLanguageService | undefined {
        for (const workspaceURI in workspaceLanguageService) {
            if (uri.startsWith(workspaceURI)) {
                return workspaceLanguageService[workspaceURI]
            }
        }
    }

    connection.onDidChangeConfiguration((change) => {
        // Revalidate all open text documents
        documents.all().forEach(async (textDocument) => {
            workspaceLanguageService[textDocument.uri] = await createLanguageService(textDocument.uri)
        })
    })

    documents.onDidSave(async change => {
        // if the saved file is the master.css file, we need to refresh the css instance
        if (path.parse(change.document.uri).name === 'master.css') {
            const targetCSSLS = workspaceLanguageService[change.document.uri]
            targetCSSLS.css.refresh(targetCSSLS.exploreConfig())
        }
    })

    connection.onInitialize((params: InitializeParams) => {
        const capabilities = params.capabilities

        // Does the client support the `workspace/configuration` request?
        // If not, we fall back using global settings.
        hasConfigurationCapability = !!(
            capabilities.workspace && !!capabilities.workspace.configuration
        )
        hasWorkspaceFolderCapability = !!(
            capabilities.workspace && !!capabilities.workspace.workspaceFolders
        )

        const result: InitializeResult = {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                // Tell the client that this server supports code completion.
                completionProvider: {
                    resolveProvider: true,
                    workDoneProgress: false,
                    triggerCharacters: [':', '@', '\'']
                },
                colorProvider: true,
                hoverProvider: true
            }
        }
        if (hasWorkspaceFolderCapability) {
            result.capabilities.workspace = {
                workspaceFolders: {
                    supported: true
                }
            }
        }
        return result
    })

    connection.onInitialized(async () => {
        const workspaceFolders = await connection.workspace.getWorkspaceFolders()
        if (workspaceFolders) {
            await workspaceFolders.map(async (folder) => {
                workspaceLanguageService[folder.uri] = await createLanguageService(folder.uri)
            })
        }
        if (hasConfigurationCapability) {
            // Register for all configuration changes.
            connection.client.register(DidChangeConfigurationNotification.type, undefined)
        }
    })

    connection.onHover((params) => {
        const languageService = findCurrentLanguageService(params.textDocument.uri)
        if (languageService) {
            const document = documents.get(params.textDocument.uri)
            if (document) return languageService.onHover(document, params.position)
        }
    })

    connection.onCompletion((params) => {
        const languageService = findCurrentLanguageService(params.textDocument.uri)
        if (languageService) {
            const document = documents.get(params.textDocument.uri)
            if (document) return languageService.onCompletion(document, params.position)
        }
    })

    connection.onDocumentColor((params) => {
        const languageService = findCurrentLanguageService(params.textDocument.uri)
        if (languageService) {
            const document = documents.get(params.textDocument.uri)
            if (document) return languageService.onDocumentColor(document)
        }
    })

    connection.onColorPresentation((params) => {
        const languageService = findCurrentLanguageService(params.textDocument.uri)
        if (languageService) {
            const document = documents.get(params.textDocument.uri)
            if (document) return languageService.onColorPresentation(document, params.color, params.range)
        }
    })

    connection.onCompletionResolve(
        (item: CompletionItem): CompletionItem => {
            return item
        }
    )

    // Make the text document manager listen on the connection
    // for open, change and close text document events
    documents.listen(connection)

    // Listen on the connection
    connection.listen()

    return connection
}