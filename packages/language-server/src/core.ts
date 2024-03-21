import { createConnection, TextDocuments, ProposedFeatures, InitializeParams, DidChangeConfigurationNotification, CompletionItem, TextDocumentSyncKind, InitializeResult } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import path from 'path'
import { fileURLToPath } from 'url'
import CSSLanguageService from '@master/css-language-service'

export default class CSSLanguageServer {
    workspaceLanguageService: Record<string, CSSLanguageService> = {}
    connection = createConnection(ProposedFeatures.all)
    documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

    async createLanguageService(workspaceURI: string) {
        console.log('Create a language service for', workspaceURI)
        const cwd = fileURLToPath(workspaceURI.replace('%3A', ':'))
        const settings = await this.connection.workspace.getConfiguration({
            scopeUri: workspaceURI,
            section: 'masterCSS'
        })
        return new CSSLanguageService({ settings, cwd })
    }

    // find the workspace language service for the given uri
    findCurrentLanguageService(uri: string): CSSLanguageService | undefined {
        for (const workspaceURI in this.workspaceLanguageService) {
            if (uri.startsWith(workspaceURI)) {
                return this.workspaceLanguageService[workspaceURI]
            }
        }
    }

    connect() {
        let hasConfigurationCapability = false
        let hasWorkspaceFolderCapability = false

        this.connection.onDidChangeConfiguration((change) => {
            // Revalidate all open text documents
            this.documents.all().forEach(async (textDocument) => {
                this.workspaceLanguageService[textDocument.uri] = await this.createLanguageService(textDocument.uri)
            })
        })

        this.documents.onDidSave(async change => {
            // if the saved file is the master.css file, we need to refresh the css instance
            if (path.parse(change.document.uri).name === 'master.css') {
                const targetCSSLS = this.workspaceLanguageService[change.document.uri]
                targetCSSLS.css.refresh(targetCSSLS.exploreConfig())
            }
        })

        this.connection.onInitialize((params: InitializeParams) => {
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

        this.connection.onInitialized(async () => {
            const workspaceFolders = await this.connection.workspace.getWorkspaceFolders()
            if (workspaceFolders) {
                await workspaceFolders.map(async (folder) => {
                    this.workspaceLanguageService[folder.uri] = await this.createLanguageService(folder.uri)
                })
            }
            if (hasConfigurationCapability) {
                // Register for all configuration changes.
                this.connection.client.register(DidChangeConfigurationNotification.type, undefined)
            }
        })

        this.connection.onHover((params) => {
            const languageService = this.findCurrentLanguageService(params.textDocument.uri)
            if (languageService) {
                const document = this.documents.get(params.textDocument.uri)
                if (document) return languageService.onHover(document, params.position)
            }
        })

        this.connection.onCompletion((params) => {
            const languageService = this.findCurrentLanguageService(params.textDocument.uri)
            if (languageService) {
                const document = this.documents.get(params.textDocument.uri)
                if (document) return languageService.onCompletion(document, params.position)
            }
        })

        this.connection.onDocumentColor((params) => {
            const languageService = this.findCurrentLanguageService(params.textDocument.uri)
            if (languageService) {
                const document = this.documents.get(params.textDocument.uri)
                if (document) return languageService.onDocumentColor(document)
            }
        })

        this.connection.onColorPresentation((params) => {
            const languageService = this.findCurrentLanguageService(params.textDocument.uri)
            if (languageService) {
                const document = this.documents.get(params.textDocument.uri)
                if (document) return languageService.onColorPresentation(document, params.color, params.range)
            }
        })

        this.connection.onCompletionResolve(
            (item: CompletionItem): CompletionItem => {
                return item
            }
        )

        // Make the text document manager listen on the connection
        // for open, change and close text document events
        this.documents.listen(this.connection)

        // Listen on the connection
        this.connection.listen()
    }

    dispose() {
        this.connection.dispose()
    }
}
