import { createConnection, TextDocuments, InitializeParams, InitializeResult, WorkspaceFolder, Disposable, Connection, ClientCapabilities, TextDocumentChangeEvent, DidChangeConfigurationParams, HoverParams, CompletionParams, DocumentColorParams, ColorPresentationParams, RemoteConsole, SemanticTokensParams, TextDocumentPositionParams, DiagnosticSeverity, type Diagnostic, type DiagnosticRelatedInformation, type Range } from 'vscode-languageserver/node.js'
import { TextDocument } from 'vscode-languageserver-textdocument'
import path from 'node:path'
import CSSLanguageService, { Settings as CSSLanguageServiceSettings } from '@master/css-language-service'
import { compileCSSPlan } from '@master/css-compiler'
import { Settings } from './settings'
import {
    findCSSPlanEntryFiles,
    findMasterCSSWorkspaceDirectories
} from '@master/css-configer/css'
import { loadProjectPlan } from '@master/css-configer/load'
import extend from '@techor/extend'
import settings from './settings'
import type { MasterCSSPlan } from '@master/css'
import { SERVER_CAPABILITIES } from '@master/css-language-service'
import glob from 'fast-glob'
import { URI } from 'vscode-uri'
import { CSSDirectiveError, type CSSDirectiveSourceReference } from 'shared/css-directives'

export declare interface Workspace {
    uri: string
    openedTextDocuments: TextDocument[]
    languageService?: CSSLanguageService
    languageServiceSettings: CSSLanguageServiceSettings
    planEntries?: string[]
}

export const ACTIVE_SEMANTIC_TOKENS_REQUEST = 'masterCSS/renderActiveSemanticTokens'
export const DOCUMENT_SEMANTIC_TOKENS_REQUEST = 'masterCSS/renderDocumentSemanticTokens'

const CSS_DIAGNOSTIC_LANGUAGE_IDS = new Set(['css', 'scss', 'less'])
const SFC_DIAGNOSTIC_LANGUAGE_IDS = new Set(['vue', 'svelte', 'astro'])
const STYLE_BLOCK_RE = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi

interface CSSDiagnosticSource {
    source: string
    offset: number
}

function isCSSDiagnosticDocument(textDocument: TextDocument) {
    return CSS_DIAGNOSTIC_LANGUAGE_IDS.has(textDocument.languageId)
        || SFC_DIAGNOSTIC_LANGUAGE_IDS.has(textDocument.languageId)
}

function getSFCStyleLanguage(attributes: string) {
    const match = /\blang\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i.exec(attributes)
    return (match?.[1] || match?.[2] || match?.[3] || 'css').toLowerCase()
}

function getCSSDiagnosticSources(textDocument: TextDocument): CSSDiagnosticSource[] {
    const text = textDocument.getText()
    if (CSS_DIAGNOSTIC_LANGUAGE_IDS.has(textDocument.languageId)) {
        return [{ source: text, offset: 0 }]
    }
    if (!SFC_DIAGNOSTIC_LANGUAGE_IDS.has(textDocument.languageId)) return []
    const sources: CSSDiagnosticSource[] = []
    STYLE_BLOCK_RE.lastIndex = 0
    for (const match of text.matchAll(STYLE_BLOCK_RE)) {
        const styleLanguage = getSFCStyleLanguage(match[1])
        if (!CSS_DIAGNOSTIC_LANGUAGE_IDS.has(styleLanguage)) continue
        const source = match[2]
        const offset = (match.index || 0) + match[0].indexOf(source)
        sources.push({ source, offset })
    }
    return sources
}

function isCSSDirectiveError(error: unknown): error is CSSDirectiveError {
    return error instanceof CSSDirectiveError
        || (
            !!error
            && typeof error === 'object'
            && (error as { name?: unknown }).name === 'CSSDirectiveError'
            && typeof (error as { code?: unknown }).code === 'string'
        )
}

function getInitializationSettings(initializationOptions: unknown): Settings | undefined {
    if (!initializationOptions || typeof initializationOptions !== 'object') return
    const options = initializationOptions as { masterCSS?: Settings } & Settings
    return options.masterCSS ?? options
}

export default class CSSLanguageServer {
    workspaceFolders: WorkspaceFolder[] = []
    workspaces = new Map<string, Workspace>()
    globalWorkspace: Workspace = {
        uri: '',
        openedTextDocuments: [],
        languageServiceSettings: this.settings as CSSLanguageServiceSettings
    }
    documents: TextDocuments<TextDocument>
    initializing?: Promise<void>
    clientCapabilities: ClientCapabilities = {}
    settings?: Settings
    console: RemoteConsole
    private disposables: Disposable[] = []

    constructor(
        public connection: Connection = process.argv.includes('--stdio')
            ? createConnection(process.stdin, process.stdout)
            : createConnection(),
        public customSettings?: Settings
    ) {
        this.documents = new TextDocuments(TextDocument)
        this.settings = extend(settings, this.customSettings) as Settings
        this.globalWorkspace.languageServiceSettings = this.settings as CSSLanguageServiceSettings
        this.console = new Proxy(this.connection.console, {
            get: (target, prop: keyof RemoteConsole) => {
                if (!this.settings?.verbose) return () => { }
                return this.connection.console[prop]
            }
        })
    }

    start() {
        this.disposables.push(
            this.documents.onDidSave(this.onDidSave.bind(this)),
            this.documents.onDidOpen(this.onDidOpen.bind(this)),
            this.documents.onDidChangeContent(this.onDidChangeContent.bind(this)),
            this.documents.onDidClose(this.onDidClose.bind(this)),
            this.documents.listen(this.connection),
            this.connection.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this)),
            this.connection.onHover(this.onHover.bind(this)),
            this.connection.onCompletion(this.onCompletion.bind(this)),
            this.connection.onDocumentColor(this.onDocumentColor.bind(this)),
            this.connection.onColorPresentation(this.onColorPresentation.bind(this)),
            this.connection.languages.semanticTokens.on(this.onSemanticTokens.bind(this)),
            this.connection.onRequest(DOCUMENT_SEMANTIC_TOKENS_REQUEST, this.onDocumentSemanticTokens.bind(this)),
            this.connection.onRequest(ACTIVE_SEMANTIC_TOKENS_REQUEST, this.onActiveSemanticTokens.bind(this)),
            this.connection.onInitialize(this.onInitialize.bind(this)),
            this.connection.onInitialized(() => this.init())
        )
        this.connection.listen()
    }

    init() {
        if (this.initializing) return this.initializing
        return this.initializing = new Promise(async (resolve) => {
            await Promise.all(this.workspaceFolders.map((folder) => this.initWorkspaceFolder(folder.uri)))
            resolve()
        })
    }

    onInitialize(params: InitializeParams): InitializeResult {
        this.clientCapabilities = params.capabilities
        const initializationSettings = getInitializationSettings(params.initializationOptions)
        if (initializationSettings) {
            this.customSettings = extend(this.customSettings, initializationSettings) as Settings
            this.settings = extend(settings, this.customSettings) as Settings
            this.globalWorkspace.languageServiceSettings = this.settings as CSSLanguageServiceSettings
        }
        if (params.workspaceFolders?.length) {
            this.workspaceFolders = params.workspaceFolders
        }
        const capabilities = {
            ...SERVER_CAPABILITIES
        }
        if (this.settings?.embeddedSyntaxHighlighting !== 'always') {
            delete capabilities.semanticTokensProvider
        }
        return {
            capabilities
        }
    }

    async onHover(params: HoverParams) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.textDocument.uri)
        if (workspace?.languageService) {
            const document = this.documents.get(params.textDocument.uri)
            if (document) return workspace.languageService.inspectSyntax(document, params.position)
        }
    }

    async onCompletion(params: CompletionParams) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.textDocument.uri)
        if (workspace?.languageService) {
            const document = this.documents.get(params.textDocument.uri)
            if (document) return workspace.languageService.suggestSyntax(document, params.position, params.context)
        }
    }

    async onDocumentColor(params: DocumentColorParams) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.textDocument.uri)
        if (workspace?.languageService) {
            const document = this.documents.get(params.textDocument.uri)
            if (document) return workspace.languageService.renderSyntaxColors(document)
        }
    }

    async onColorPresentation(params: ColorPresentationParams) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.textDocument.uri)
        if (workspace?.languageService) {
            const document = this.documents.get(params.textDocument.uri)
            if (document) return workspace.languageService.editSyntaxColors(document, params.color, params.range)
        }
    }

    async onSemanticTokens(params: SemanticTokensParams) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.textDocument.uri)
        if (workspace?.languageService) {
            const document = this.documents.get(params.textDocument.uri)
                ?? workspace.openedTextDocuments.find((document) => document.uri === params.textDocument.uri)
            if (document) return workspace.languageService.renderSemanticTokens(document) ?? { data: [] }
        }
        return { data: [] }
    }

    async onDocumentSemanticTokens(params: SemanticTokensParams) {
        return this.onSemanticTokens(params)
    }

    async onActiveSemanticTokens(params: TextDocumentPositionParams) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.textDocument.uri)
        if (workspace?.languageService) {
            const document = this.documents.get(params.textDocument.uri)
                ?? workspace.openedTextDocuments.find((document) => document.uri === params.textDocument.uri)
            if (document) return workspace.languageService.renderSemanticTokensAtPosition(document, params.position) ?? { data: [] }
        }
        return { data: [] }
    }

    async onDidOpen(params: TextDocumentChangeEvent<TextDocument>) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.document.uri)
        if (!workspace) return
        if (workspace.openedTextDocuments.includes(params.document)) {
            this.publishCSSDirectiveDiagnostics(params.document, workspace)
            return
        }
        if (!workspace.openedTextDocuments.length) {
            await this.initWorkspaceLanguageService(workspace)
        }
        workspace.openedTextDocuments.push(params.document)
        this.publishCSSDirectiveDiagnostics(params.document, workspace)
    }

    async onDidChangeContent(params: TextDocumentChangeEvent<TextDocument>) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.document.uri)
        if (!workspace) return
        this.publishCSSDirectiveDiagnostics(params.document, workspace)
    }

    async onDidClose(params: TextDocumentChangeEvent<TextDocument>) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.document.uri)
        if (!workspace) return
        workspace.openedTextDocuments.splice(workspace.openedTextDocuments.indexOf(params.document), 1)
        this.connection.sendDiagnostics({ uri: params.document.uri, diagnostics: [] })
        if (!workspace.openedTextDocuments.length) {
            this.destroyLanguageService(workspace)
        }
    }

    async onDidSave(params: TextDocumentChangeEvent<TextDocument>) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.document.uri)
        if (!workspace) return
        this.publishCSSDirectiveDiagnostics(params.document, workspace)
        const name = path.basename(URI.parse(params.document.uri).fsPath)
        if (name.endsWith('.css')) {
            this.refreshSemanticTokens()
            this.connection.sendRequest('masterCSS/restart', {
                title: 'Updating Master CSS configuration',
            })
        }
    }

    async onDidChangeConfiguration({ settings: changedSettings }: DidChangeConfigurationParams) {
        await this.init()
        if (changedSettings?.masterCSS) {
            this.connection.sendNotification('masterCSS/globalSettingsChanged', changedSettings.masterCSS)
            this.customSettings = changedSettings.masterCSS
            this.settings = extend(settings, this.customSettings) as Settings
            this.globalWorkspace.languageServiceSettings = this.settings as CSSLanguageServiceSettings
            this.refreshSemanticTokens()
            this.connection.sendRequest('masterCSS/restart', {
                title: 'Updating Master CSS settings',
            })
            for (const workspace of [this.globalWorkspace, ...this.workspaces.values()]) {
                for (const document of workspace.openedTextDocuments) {
                    this.publishCSSDirectiveDiagnostics(document, workspace)
                }
            }
        }
    }

    private async initWorkspaceFolder(workspaceFolderURI: string) {
        const workspaceFolderCWD = URI.parse(workspaceFolderURI).fsPath
        let customWorkspaceFolderSettings: Settings | undefined
        if (this.clientCapabilities.workspace?.configuration) {
            customWorkspaceFolderSettings = await this.connection.workspace.getConfiguration({
                scopeUri: workspaceFolderURI,
                section: 'masterCSS'
            }) as Settings
        }
        const { workspaces, ...languageServiceSettings } = extend(settings, this.customSettings, customWorkspaceFolderSettings) as Settings
        const resolvedWorkspaceDirectories = new Set<string>([workspaceFolderCWD])
        if (workspaceFolderCWD) {
            this.console.info(`Registered workspace folder ${workspaceFolderURI}`)
        } else {
            this.console.info(`Registered global workspace folder`)
        }
        if (workspaces === 'auto') {
            for (const workspaceDir of await findMasterCSSWorkspaceDirectories(workspaceFolderCWD)) {
                resolvedWorkspaceDirectories.add(workspaceDir)
            }
        } else if (workspaces?.length) {
            (await glob(workspaces, {
                cwd: workspaceFolderCWD,
                absolute: true,
                onlyDirectories: true,
                ignore: ['**/node_modules/**']
            }))
                .forEach((workspaceDir) => resolvedWorkspaceDirectories.add(path.resolve(workspaceDir)))
        }
        for (const workspaceDir of resolvedWorkspaceDirectories) {
            const workspaceURI = URI.file(workspaceDir).toString()
            this.console.info(`Added workspace ${workspaceURI}`)
            this.workspaces.set(workspaceURI, {
                uri: workspaceURI,
                openedTextDocuments: [],
                languageServiceSettings,
                planEntries: await findCSSPlanEntryFiles(workspaceDir)
            })
        }
    }

    async initWorkspaceLanguageService(workspace: Workspace) {
        let workspacePlan: MasterCSSPlan | undefined
        if (workspace !== this.globalWorkspace) {
            try {
                workspacePlan = await this.loadWorkspacePlan(workspace)
            } catch (e: any) {
                this.console.info(`Failed to load plan from ${workspace.uri}`)
                this.console.error(e instanceof Error ? e.stack : e.toString())
            }
            if (workspacePlan) {
                this.console.info(`Initialized workspace ${workspace.planEntries?.length ? '(with plan entry)' : '(with plan)'} ${workspace.uri}`)
            } else {
                this.console.info(`Initialized workspace ${workspace.uri}`)
            }
        }
        workspace.languageService = new CSSLanguageService({ ...workspace.languageServiceSettings, plan: workspacePlan })
    }

    private async loadWorkspacePlan(workspace: Workspace) {
        const cwd = workspace.uri ? URI.parse(workspace.uri).fsPath : process.cwd()
        const result = await loadProjectPlan(cwd)
        return result.entries.length ? result.plan : workspace.languageServiceSettings.plan
    }

    destroyLanguageService(workspace: Workspace) {
        this.console.info(`Destroyed workspace ${workspace.uri}`)
        delete workspace.languageService
    }

    findClosestWorkspace(textDocumentURI: string) {
        let foundWorkspace: Workspace | undefined
        for (const [uri, workspace] of this.workspaces) {
            if (!uri) continue
            if (textDocumentURI.startsWith(uri) && (!foundWorkspace || uri.length > (foundWorkspace.uri || '').length)) {
                foundWorkspace = workspace
            }
        }
        if (foundWorkspace) return foundWorkspace
        this.console.info(`This is an external document ${textDocumentURI} with the global workspace`)
        return this.globalWorkspace
    }

    private publishCSSDirectiveDiagnostics(textDocument: TextDocument, workspace: Workspace) {
        if (!isCSSDiagnosticDocument(textDocument)) return
        const diagnostics: Diagnostic[] = []
        const documentFile = path.resolve(URI.parse(textDocument.uri).fsPath)
        for (const { source, offset } of getCSSDiagnosticSources(textDocument)) {
            try {
                compileCSSPlan(source, {
                    from: documentFile
                })
            } catch (error) {
                if (!isCSSDirectiveError(error)) continue
                const diagnostic = this.createCSSDirectiveDiagnostic(error, textDocument, documentFile, offset)
                if (diagnostic) diagnostics.push(diagnostic)
            }
        }

        this.connection.sendDiagnostics({
            uri: textDocument.uri,
            diagnostics
        })
    }

    private createCSSDirectiveDiagnostic(
        error: CSSDirectiveError,
        textDocument: TextDocument,
        documentFile: string,
        sourceOffset: number
    ): Diagnostic | undefined {
        if (error.source?.file && path.resolve(error.source.file) !== documentFile) return
        return {
            range: this.createCSSDirectiveRange(error.source, textDocument, documentFile, sourceOffset),
            severity: DiagnosticSeverity.Error,
            code: error.code,
            source: 'Master CSS',
            message: error.message,
            relatedInformation: this.createCSSDirectiveRelatedInformation(error.related, textDocument, documentFile, sourceOffset)
        }
    }

    private createCSSDirectiveRelatedInformation(
        related: CSSDirectiveError['related'],
        textDocument: TextDocument,
        documentFile: string,
        sourceOffset: number
    ): DiagnosticRelatedInformation[] | undefined {
        if (!related?.length) return
        return related.map(({ message, source }) => ({
            message,
            location: {
                uri: source?.file ? URI.file(source.file).toString() : textDocument.uri,
                range: this.createCSSDirectiveRange(source, textDocument, documentFile, sourceOffset)
            }
        }))
    }

    private createCSSDirectiveRange(
        source: CSSDirectiveSourceReference | undefined,
        textDocument: TextDocument,
        documentFile: string,
        sourceOffset: number
    ): Range {
        if (source?.file && path.resolve(source.file) !== documentFile) {
            return source.loc
                ? {
                    start: {
                        line: Math.max(0, source.loc.start.line - 1),
                        character: Math.max(0, source.loc.start.column - 1)
                    },
                    end: {
                        line: Math.max(0, source.loc.end.line - 1),
                        character: Math.max(0, source.loc.end.column - 1)
                    }
                }
                : {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 }
                }
        }

        const start = Math.max(0, (source?.range.start || 0) + sourceOffset)
        const end = Math.max(start, (source?.range.end || 0) + sourceOffset)
        return {
            start: textDocument.positionAt(start),
            end: textDocument.positionAt(end)
        }
    }

    private refreshSemanticTokens() {
        if (this.settings?.embeddedSyntaxHighlighting !== 'always') return
        if (!this.clientCapabilities.workspace?.semanticTokens?.refreshSupport) return
        this.connection.languages.semanticTokens.refresh()
    }

    stop(): void {
        this.connection.sendNotification('masterCSS/dispose')
        this.disposables.forEach((disposable) => disposable.dispose())
        this.disposables.length = 0
        this.connection.dispose()
        this.initializing = undefined
    }
}
