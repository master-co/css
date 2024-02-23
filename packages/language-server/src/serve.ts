import { createConnection, TextDocuments, ProposedFeatures, InitializeParams, DidChangeConfigurationNotification, CompletionItem, TextDocumentPositionParams, TextDocumentSyncKind, InitializeResult, DocumentColorParams, ColorInformation, ColorPresentationParams } from 'vscode-languageserver/node'
import { WorkspaceFolder } from 'vscode-languageserver'
import { MasterCSS } from '@master/css'
import { minimatch } from 'minimatch'
import { TextDocument } from 'vscode-languageserver-textdocument'
import path from 'path'
import { fileURLToPath } from 'url'
import { settings as defaultSettings, doHover, positionCheck, getColorPresentation, getDocumentColors, getLastInstance, getCompletionItem, getConfigColorsCompletionItem, checkConfigColorsBlock } from '@master/css-language-service'
import exploreConfig from 'explore-config'

export default function serve() {
    const connection = createConnection(ProposedFeatures.all)
    const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

    let hasConfigurationCapability = false
    let hasWorkspaceFolderCapability = false
    let hasDiagnosticRelatedInformationCapability = false
    let settings: typeof defaultSettings

    let css: MasterCSS | undefined
    let customConfig: any
    const configFileLocation = ''

    let globalSettings: any = defaultSettings

    // Cache the settings of all open documents
    const documentSettings: Map<string, Thenable<typeof defaultSettings>> = new Map()

    connection.onDidChangeConfiguration(change => {
        if (hasConfigurationCapability) {
            // Reset all cached document settings
            documentSettings.clear()
        } else {
            globalSettings = <typeof defaultSettings>(
                (change.settings.masterCSS || defaultSettings)
            )
        }

        // Revalidate all open text documents
        documents.all().forEach(validateTextDocument)
    })

    async function getDocumentSettings(resource: string): Promise<typeof defaultSettings> {
        if (!hasConfigurationCapability) {
            return Promise.resolve(globalSettings)
        }
        let result = documentSettings.get(resource)

        if (!result) {
            result = connection.workspace.getConfiguration({
                scopeUri: resource,
                section: 'masterCSS'
            })
            documentSettings.set(resource, result)
        }
        return result
    }

    // Only keep settings for open documents
    documents.onDidClose(e => {
        documentSettings.delete(e.document.uri)
    })

    // The content of a text document has changed. This event is emitted
    // when the text document first opened or when its content has changed.
    documents.onDidOpen(change => {
        validateTextDocument(change.document)
    })

    documents.onDidSave(async change => {
        if (path.parse(change.document.uri).name === 'master.css') {
            await loadMasterCssConfig(change.document.uri)
        }
    })

    async function validateTextDocument(textDocument: TextDocument): Promise<void> {
        // In this simple example we get the settings for every validate run.
        settings = await getDocumentSettings(textDocument.uri)
        await loadMasterCssConfig(textDocument.uri)
    }

    async function loadMasterCssConfig(resource: string) {
        const workspaceFolders = await connection.workspace.getWorkspaceFolders()
        let root: WorkspaceFolder | undefined
        if (workspaceFolders?.length === 1) {
            root = workspaceFolders[0]
        } else {
            root = workspaceFolders?.find(x => resource.includes(x.uri))
        }
        if (root?.uri) {
            const configCWD = fileURLToPath(root.uri.replace('%3A', ':'))
            customConfig = exploreConfig(settings.config || 'master.css', {
                cwd: configCWD,
                found: (basename) => console.log`Loaded **${basename}**`
            })
            css = new MasterCSS(customConfig)
        }
    }

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
        hasDiagnosticRelatedInformationCapability = !!(
            capabilities.textDocument &&
            capabilities.textDocument.publishDiagnostics &&
            capabilities.textDocument.publishDiagnostics.relatedInformation
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
                colorProvider: {},
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

    connection.onInitialized(() => {
        if (hasConfigurationCapability) {
            // Register for all configuration changes.
            connection.client.register(DidChangeConfigurationNotification.type, undefined)
        }
    })

    connection.onCompletion(
        (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
            if (settings.suggestions == true && CheckFilesExclude(textDocumentPosition.textDocument.uri)) {

                const documentUri = textDocumentPosition.textDocument.uri
                const document = documents.get(documentUri)
                const language = documentUri.substring(documentUri.lastIndexOf('.') + 1)
                const position = textDocumentPosition.position
                if (document) {
                    const text = document.getText()
                    const positionIndex = document.offsetAt(position) ?? 0
                    const startIndex = document.offsetAt({ line: position.line - 100, character: 0 }) ?? 0
                    const endIndex = document.offsetAt({ line: position.line + 100, character: 0 }) ?? undefined
                    const checkResult = positionCheck(text.substring(startIndex, endIndex), positionIndex, startIndex, settings.classMatch)

                    const lineText: string = document.getText({
                        start: { line: position.line, character: 0 },
                        end: { line: position.line, character: position.character },
                    }).trim()


                    const lastInstance = getLastInstance(lineText, position, language)


                    if (lastInstance.isInstance == true && checkResult) {
                        return getCompletionItem(lastInstance.lastKey, lastInstance.triggerKey, lastInstance.isStart, lastInstance.language, css)
                    } else if (lastInstance.isInstance == true && checkConfigColorsBlock(document, textDocumentPosition.position) == true) {
                        return getConfigColorsCompletionItem(css)
                    }
                }
            }
            return []
        }
    )
    connection.onCompletionResolve(
        (item: CompletionItem): CompletionItem => {

            return item
        }
    )


    connection.onDocumentColor(
        async (documentColor: DocumentColorParams): Promise<ColorInformation[]> => {
            if (settings == null) {
                return []
            }
            if (settings.previewColors == true && CheckFilesExclude(documentColor.textDocument.uri)) {
                const documentUri = documentColor.textDocument.uri
                const document = documents.get(documentUri)
                if (document) {
                    const text = document.getText() ?? ''
                    if (typeof document == 'undefined') {
                        return []
                    }

                    const colorIndexs = (await getDocumentColors(text, css))

                    const colorIndexSet = new Set()
                    const colorInformations = colorIndexs
                        .filter(item => {
                            if (colorIndexSet.has(item.index.start)) {
                                return false
                            } else {
                                colorIndexSet.add(item.index.start)
                                return true
                            }
                        })
                        .map(x => ({
                            range: {
                                start: document.positionAt(x.index.start),
                                end: document.positionAt(x.index.end)
                            },
                            color: x.color
                        }))

                    return colorInformations
                }
            }
            return []
        })

    connection.onColorPresentation((params: ColorPresentationParams) => {
        if (settings.previewColors == true && CheckFilesExclude(params.textDocument.uri)) {
            const document = documents.get(params.textDocument.uri)
            if (document) {
                const text = document.getText()
                const colorRender = ['(?<=colors:\\s*{\\s*.*)([^}]*)}']

                const positionIndex = document.offsetAt(params.range.start) ?? 0
                const startIndex = document.offsetAt({ line: params.range.start.line - 100, character: 0 }) ?? 0
                const endIndex = document.offsetAt({ line: params.range.start.line + 100, character: 0 }) ?? undefined
                const checkResult = positionCheck(text.substring(startIndex, endIndex), positionIndex, startIndex, colorRender)
                return getColorPresentation(params, checkResult !== null)
            }

        }
        return []
    })

    connection.onHover(textDocumentPosition => {
        if (settings.inspect == true && CheckFilesExclude(textDocumentPosition.textDocument.uri)) {
            const document = documents.get(textDocumentPosition.textDocument.uri)
            const position = textDocumentPosition.position
            if (document) {
                const text = document.getText()
                const positionIndex = document.offsetAt(position) ?? 0
                const startIndex = document.offsetAt({ line: position.line - 100, character: 0 }) ?? 0
                const endIndex = document.offsetAt({ line: position.line + 100, character: 0 }) ?? undefined
                const checkResult = positionCheck(text.substring(startIndex, endIndex), positionIndex, startIndex, settings.classMatch)
                if (checkResult) {
                    return doHover(checkResult.instanceContent, indexToRange(checkResult.index, document), customConfig)
                }
            }
        }
        return null
    })

    function CheckFilesExclude(path: string): boolean {
        for (const exclude of (settings as any).files.exclude) {
            if (minimatch(path, exclude)) {
                return false
            }
        }
        return true
    }

    function indexToRange(index: { start: number, end: number }, document: TextDocument) {
        return {
            start: document.positionAt(index.start),
            end: document.positionAt(index.end)
        }
    }

    // Make the text document manager listen on the connection
    // for open, change and close text document events
    documents.listen(connection)

    // Listen on the connection
    connection.listen()
}
