import { createConnection, TextDocuments, InitializeParams, InitializeResult, WorkspaceFolder, Disposable, Connection, ClientCapabilities, TextDocumentChangeEvent, DidChangeConfigurationParams, HoverParams, CompletionParams, DocumentColorParams, ColorPresentationParams, RemoteConsole, SemanticTokensParams } from 'vscode-languageserver/node.js'
import { TextDocument } from 'vscode-languageserver-textdocument'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import CSSLanguageService, { Settings as CSSLanguageServiceSettings } from '@master/css-language-service'
import { Settings } from './settings'
import exploreConfig from '@master/css-explore-config'
import extend from '@techor/extend'
import settings from './settings'
import type { Config } from 'shared/css-config'
import { SERVER_CAPABILITIES } from '@master/css-language-service'
import glob from 'fast-glob'
import { URI } from 'vscode-uri'

const MASTER_CSS_WORKSPACE_DEPENDENCIES = new Set([
    '@master/css',
    '@master/css-runtime',
    '@master/css-server',
    '@master/css-extractor',
    '@master/css-cli',
    '@master/css.vite',
    '@master/css.webpack',
    '@master/css.astro',
    '@master/css.nuxt',
    '@master/css.react',
    '@master/css.vue',
    '@master/css.svelte',
    '@master/css.next'
])

const PACKAGE_JSON_DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
] as const

type PackageJSON = Partial<Record<typeof PACKAGE_JSON_DEPENDENCY_FIELDS[number], unknown>>

export declare interface Workspace {
    uri: string
    openedTextDocuments: TextDocument[]
    languageService?: CSSLanguageService
    languageServiceSettings: CSSLanguageServiceSettings
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
            this.documents.onDidClose(this.onDidClose.bind(this)),
            this.documents.listen(this.connection),
            this.connection.onDidChangeConfiguration(this.onDidChangeConfiguration.bind(this)),
            this.connection.onHover(this.onHover.bind(this)),
            this.connection.onCompletion(this.onCompletion.bind(this)),
            this.connection.onDocumentColor(this.onDocumentColor.bind(this)),
            this.connection.onColorPresentation(this.onColorPresentation.bind(this)),
            this.connection.languages.semanticTokens.on(this.onSemanticTokens.bind(this)),
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
        if (params.workspaceFolders?.length) {
            this.workspaceFolders = params.workspaceFolders
        }
        const capabilities = {
            ...SERVER_CAPABILITIES
        }
        if (this.settings?.renderSemanticTokens === false) {
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

    async onDidOpen(params: TextDocumentChangeEvent<TextDocument>) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.document.uri)
        if (!workspace || workspace.openedTextDocuments.includes(params.document)) return
        if (!workspace.openedTextDocuments.length) {
            await this.initWorkspaceLanguageService(workspace)
        }
        workspace.openedTextDocuments.push(params.document)
    }

    async onDidClose(params: TextDocumentChangeEvent<TextDocument>) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.document.uri)
        if (!workspace) return
        workspace.openedTextDocuments.splice(workspace.openedTextDocuments.indexOf(params.document), 1)
        if (!workspace.openedTextDocuments.length) {
            this.destroyLanguageService(workspace)
        }
    }

    async onDidSave(params: TextDocumentChangeEvent<TextDocument>) {
        await this.init()
        const workspace = this.findClosestWorkspace(params.document.uri)
        if (!workspace) return
        const name = path.basename(URI.parse(params.document.uri).fsPath)
        if (name === 'master.css' || name.endsWith('.css') || name.startsWith('master.css.')) {
            this.refreshSemanticTokens()
            this.connection.sendRequest('masterCSS/restart', {
                title: 'Updating Master CSS configuration',
            })
        }
    }

    async onDidChangeConfiguration({ settings }: DidChangeConfigurationParams) {
        await this.init()
        if (settings?.masterCSS) {
            this.connection.sendNotification('masterCSS/globalSettingsChanged', settings.masterCSS)
            this.customSettings = settings.masterCSS
            this.refreshSemanticTokens()
            this.connection.sendRequest('masterCSS/restart', {
                title: 'Updating Master CSS settings',
            })
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
            const [workspaceConfigFiles, packageJSONFiles] = await Promise.all([
                glob(['**/master.css', '**/master.css.*'], {
                    cwd: workspaceFolderCWD,
                    absolute: true,
                    onlyFiles: true,
                    ignore: ['**/node_modules/**']
                }),
                glob('**/package.json', {
                    cwd: workspaceFolderCWD,
                    absolute: true,
                    onlyFiles: true,
                    ignore: ['**/node_modules/**']
                })
            ])
            workspaceConfigFiles
                .forEach((workspaceFile) => resolvedWorkspaceDirectories.add(path.dirname(path.resolve(workspaceFile))))
            await Promise.all(packageJSONFiles.map(async (packageJSONFile) => {
                if (await this.hasMasterCSSDependency(packageJSONFile)) {
                    resolvedWorkspaceDirectories.add(path.dirname(path.resolve(packageJSONFile)))
                }
            }))
        } else if (workspaces?.length) {
            (await glob(workspaces, {
                cwd: workspaceFolderCWD,
                absolute: true,
                onlyDirectories: true,
                ignore: ['**/node_modules/**']
            }))
                .forEach((workspaceDir) => resolvedWorkspaceDirectories.add(path.resolve(workspaceDir)))
        }
        resolvedWorkspaceDirectories.forEach(async (workspaceDir) => {
            const workspaceURI = URI.file(workspaceDir).toString()
            this.console.info(`Added workspace ${workspaceURI}`)
            this.workspaces.set(workspaceURI, {
                uri: workspaceURI,
                openedTextDocuments: [],
                languageServiceSettings
            })
        })
    }

    private async hasMasterCSSDependency(packageJSONFile: string) {
        try {
            const packageJSON = JSON.parse(await readFile(packageJSONFile, 'utf8')) as PackageJSON
            return PACKAGE_JSON_DEPENDENCY_FIELDS.some((field) => {
                const dependencies = packageJSON[field]
                if (!dependencies || typeof dependencies !== 'object') return false
                for (const dependency of MASTER_CSS_WORKSPACE_DEPENDENCIES) {
                    if (dependency in dependencies) return true
                }
                return false
            })
        } catch {
            return false
        }
    }

    async initWorkspaceLanguageService(workspace: Workspace) {
        let workspaceConfig: Config | undefined
        if (workspace !== this.globalWorkspace) {
            try {
                workspaceConfig = (await exploreConfig({
                    cwd: workspace.uri && URI.parse(workspace.uri).fsPath,
                    found: undefined
                }))?.config
            } catch (e: any) {
                this.console.info(`Failed to load config from ${workspace.uri}`)
                this.console.error(e instanceof Error ? e.stack : e.toString())
            }
            if (workspaceConfig) {
                this.console.info(`Initialized workspace ${workspaceConfig ? '(with config file)' : ''} ${workspace.uri}`)
            } else {
                this.console.info(`Initialized workspace ${workspace.uri}`)
            }
        }
        workspace.languageService = new CSSLanguageService({ ...workspace.languageServiceSettings, config: workspaceConfig })
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

    private refreshSemanticTokens() {
        if (this.settings?.renderSemanticTokens === false) return
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
