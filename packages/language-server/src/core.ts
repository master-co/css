import { createConnection, TextDocuments, InitializeParams, InitializeResult, WorkspaceFolder, Disposable, Connection, ClientCapabilities, TextDocumentChangeEvent, DidChangeConfigurationParams, HoverParams, CompletionParams, DocumentColorParams, ColorPresentationParams, DocumentFormattingParams, DocumentRangeFormattingParams, RemoteConsole, SemanticTokensParams, TextDocumentPositionParams, DiagnosticSeverity, TextDocumentSyncKind, type Diagnostic, type DiagnosticRelatedInformation, type Range, type ServerCapabilities, type TextEdit } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import CSSLanguageService from '@master/css-language-service'
import { compileCSSManifest } from '@master/css-compiler'
import { Settings } from './settings'
import {
  findCSSManifestEntryFiles,
  findMasterCSSWorkspaceDirectories
} from '@master/css-compiler/project/entries'
import { loadProjectManifest } from '@master/css-compiler/project'
import { resolveMasterCSSWorkspacePackages, type MasterCSSWorkspacePackageResolution } from '@master/css-compiler/project/workspace'
import { defu } from 'defu'
import settings from './settings'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  AT_TRIGGER_CHARACTER,
  DECLARATION_SEPARATOR_TRIGGER_CHARACTER,
  GROUP_TRIGGER_CHARACTER,
  INVOKED_TRIGGER_CHARACTERS,
  QUERY_TRIGGER_CHARACTERS,
  SELECTOR_TRIGGER_CHARACTERS,
  VALUE_TRIGGER_CHARACTERS
} from '@master/css-language-service/common'
import {
  createLanguageSession,
  defaultManifest,
  SEMANTIC_TOKENS_LEGEND,
} from '@master/css-tooling/language'
import glob from 'fast-glob'
import { URI } from 'vscode-uri'
import { CSSDirectiveError, type CSSDirectiveSourceReference } from '@master/css-schema/css-directives'

export declare interface Workspace {
  uri: string
  openedTextDocuments: TextDocument[]
  languageService?: CSSLanguageService
  languageServiceSettings: Settings
  baseManifest?: MasterCSSManifest
  manifestResolution?: MasterCSSWorkspacePackageResolution
  manifestSource?: 'workspace' | 'bundled'
  manifestErrors?: unknown[]
  planEntries?: string[]
}

export const ACTIVE_SEMANTIC_TOKENS_REQUEST = 'masterCSS/renderActiveSemanticTokens'
export const DOCUMENT_SEMANTIC_TOKENS_REQUEST = 'masterCSS/renderDocumentSemanticTokens'

const SERVER_CAPABILITIES: ServerCapabilities = {
  textDocumentSync: TextDocumentSyncKind.Incremental,
  completionProvider: {
    resolveProvider: false,
    workDoneProgress: false,
    triggerCharacters: [
      ...new Set([
        ...INVOKED_TRIGGER_CHARACTERS,
        ...VALUE_TRIGGER_CHARACTERS,
        ...SELECTOR_TRIGGER_CHARACTERS,
        ...QUERY_TRIGGER_CHARACTERS,
        DECLARATION_SEPARATOR_TRIGGER_CHARACTER,
        AT_TRIGGER_CHARACTER,
        GROUP_TRIGGER_CHARACTER,
      ])
    ]
  },
  colorProvider: true,
  hoverProvider: true,
  documentFormattingProvider: true,
  documentRangeFormattingProvider: true,
  semanticTokensProvider: {
    legend: SEMANTIC_TOKENS_LEGEND,
    full: true
  },
  workspace: {
    workspaceFolders: {
      supported: true,
    },
  }
}

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

function toCSSDirectiveError(error: unknown): CSSDirectiveError | undefined {
  if (isCSSDirectiveError(error)) return error
  if (!error || typeof error !== 'object') return
  const diagnostic = error as {
    code?: unknown
    message?: unknown
    source?: unknown
    range?: unknown
  }
  if (typeof diagnostic.code !== 'string' || typeof diagnostic.message !== 'string') return
  const range = diagnostic.range
  if (!range || typeof range !== 'object') return
  const { start, end } = range as { start?: unknown, end?: unknown }
  if (typeof start !== 'number' || typeof end !== 'number') return
  return new CSSDirectiveError(
    diagnostic.code,
    diagnostic.message,
    {
      ...(typeof diagnostic.source === 'string' && diagnostic.source ? { file: diagnostic.source } : {}),
      range: { start, end }
    }
  )
}

function getInitializationSettings(initializationOptions: unknown): Settings | undefined {
  if (!initializationOptions || typeof initializationOptions !== 'object') return
  const options = initializationOptions as { masterCSS?: Settings } & Settings
  return options.masterCSS ?? options
}

function isWindowsFilePath(fsPath: string) {
  return /^[a-z]:[\\/]/i.test(fsPath) || fsPath.startsWith('\\\\') || fsPath.startsWith('//')
}

function getFilePathTools(...fsPaths: string[]) {
  return fsPaths.some(isWindowsFilePath) ? path.win32 : path
}

function toComparableFilePath(uri: string) {
  const parsedURI = URI.parse(uri)
  if (parsedURI.scheme !== 'file') return
  const fsPath = parsedURI.fsPath
  if (!fsPath) return
  const filePathTools = getFilePathTools(fsPath)
  const resolvedPath = filePathTools.resolve(fsPath)
  return isWindowsFilePath(resolvedPath) ? resolvedPath.toLowerCase() : resolvedPath
}

function containsFilePath(parentPath: string, childPath: string) {
  const filePathTools = getFilePathTools(parentPath, childPath)
  const relativePath = filePathTools.relative(parentPath, childPath)
  return relativePath === ''
    || (
      !!relativePath
      && relativePath !== '..'
      && !relativePath.startsWith(`..${filePathTools.sep}`)
      && !filePathTools.isAbsolute(relativePath)
    )
}

export default class CSSLanguageServer {
  workspaceFolders: WorkspaceFolder[] = []
  workspaces = new Map<string, Workspace>()
  globalWorkspace: Workspace = {
    uri: '',
    openedTextDocuments: [],
    languageServiceSettings: this.settings as Settings,
    baseManifest: defaultManifest,
    manifestSource: 'bundled'
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
    this.settings = defu(this.customSettings, settings) as Settings
    this.globalWorkspace.languageServiceSettings = this.settings as Settings
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
      this.connection.onDocumentFormatting(this.onDocumentFormatting.bind(this)),
      this.connection.onDocumentRangeFormatting(this.onDocumentRangeFormatting.bind(this)),
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
      this.customSettings = defu(initializationSettings, this.customSettings) as Settings
      this.settings = defu(this.customSettings, settings) as Settings
      this.globalWorkspace.languageServiceSettings = this.settings as Settings
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
    if (!this.settings?.formatDirectives) {
      delete capabilities.documentFormattingProvider
      delete capabilities.documentRangeFormattingProvider
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
      if (document) return (await workspace.languageService.renderSyntaxColors(document)) ?? []
    }
    return []
  }

  async onColorPresentation(params: ColorPresentationParams) {
    await this.init()
    const workspace = this.findClosestWorkspace(params.textDocument.uri)
    if (workspace?.languageService) {
      const document = this.documents.get(params.textDocument.uri)
      if (document) return workspace.languageService.editSyntaxColors(document, params.color, params.range) ?? []
    }
    return []
  }

  private getWorkspaceDocument(uri: string) {
    const workspace = this.findClosestWorkspace(uri)
    if (!workspace?.languageService) return
    const document = this.documents.get(uri)
      ?? workspace.openedTextDocuments.find((document) => document.uri === uri)
    if (!document) return
    return {
      workspace,
      document
    }
  }

  async onDocumentFormatting(params: DocumentFormattingParams): Promise<TextEdit[]> {
    await this.init()
    const context = this.getWorkspaceDocument(params.textDocument.uri)
    return context?.workspace.languageService?.formatDirectives(context.document) ?? []
  }

  async onDocumentRangeFormatting(params: DocumentRangeFormattingParams): Promise<TextEdit[]> {
    await this.init()
    const context = this.getWorkspaceDocument(params.textDocument.uri)
    return context?.workspace.languageService?.formatDirectives(context.document, params.range) ?? []
  }

  async onSemanticTokens(params: SemanticTokensParams) {
    await this.init()
    const context = this.getWorkspaceDocument(params.textDocument.uri)
    if (context) return context.workspace.languageService?.renderSemanticTokens(context.document) ?? { data: [] }
    return { data: [] }
  }

  async onDocumentSemanticTokens(params: SemanticTokensParams) {
    return this.onSemanticTokens(params)
  }

  async onActiveSemanticTokens(params: TextDocumentPositionParams) {
    await this.init()
    const context = this.getWorkspaceDocument(params.textDocument.uri)
    if (context) return context.workspace.languageService?.renderSemanticTokensAtPosition(context.document, params.position) ?? { data: [] }
    return { data: [] }
  }

  async onDidOpen(params: TextDocumentChangeEvent<TextDocument>) {
    await this.init()
    const workspace = this.findClosestWorkspace(params.document.uri)
    if (!workspace) return
    if (workspace.openedTextDocuments.includes(params.document)) {
      this.publishDiagnostics(params.document, workspace)
      return
    }
    if (!workspace.openedTextDocuments.length) {
      await this.initWorkspaceLanguageService(workspace)
    }
    workspace.openedTextDocuments.push(params.document)
    this.publishDiagnostics(params.document, workspace)
  }

  async onDidChangeContent(params: TextDocumentChangeEvent<TextDocument>) {
    await this.init()
    const workspace = this.findClosestWorkspace(params.document.uri)
    if (!workspace) return
    this.publishDiagnostics(params.document, workspace)
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
    this.publishDiagnostics(params.document, workspace)
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
      this.settings = defu(this.customSettings, settings) as Settings
      this.globalWorkspace.languageServiceSettings = this.settings as Settings
      this.refreshSemanticTokens()
      this.connection.sendRequest('masterCSS/restart', {
        title: 'Updating Master CSS settings',
      })
      for (const workspace of [this.globalWorkspace, ...this.workspaces.values()]) {
        for (const document of workspace.openedTextDocuments) {
          this.publishDiagnostics(document, workspace)
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
    const { workspaces, ...languageServiceSettings } = defu(customWorkspaceFolderSettings, this.customSettings, settings) as Settings
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
        planEntries: await findCSSManifestEntryFiles(workspaceDir)
      })
    }
  }

  async initWorkspaceLanguageService(workspace: Workspace) {
    workspace.baseManifest = await this.loadWorkspaceBaseManifest(workspace)
    let workspacePlan: MasterCSSManifest | undefined
    workspace.manifestErrors = []
    if (workspace !== this.globalWorkspace) {
      try {
        workspacePlan = await this.loadWorkspacePlan(workspace, workspace.baseManifest)
      } catch (e: any) {
        workspace.manifestErrors = [e]
        this.console.info(`Failed to load manifest from ${workspace.uri}`)
        this.console.error(e instanceof Error ? e.stack : e.toString())
      }
      if (workspacePlan) {
        this.console.info(`Initialized workspace ${workspace.planEntries?.length ? '(with manifest entry)' : '(with manifest)'} ${workspace.uri}`)
      } else {
        this.console.info(`Initialized workspace ${workspace.uri}`)
      }
    }
    const manifest = workspacePlan
      ?? workspace.languageServiceSettings.manifest
      ?? workspace.baseManifest
    workspace.languageService = new CSSLanguageService(
      { ...workspace.languageServiceSettings, manifest },
      { session: await createLanguageSession(manifest) }
    )
  }

  private async loadWorkspacePlan(workspace: Workspace, baseManifest: MasterCSSManifest) {
    const cwd = workspace.uri ? URI.parse(workspace.uri).fsPath : process.cwd()
    const result = await loadProjectManifest(cwd, {
      baseManifest
    })
    return result.entries.length ? result.manifest : workspace.languageServiceSettings.manifest
  }

  private async loadWorkspaceBaseManifest(workspace: Workspace): Promise<MasterCSSManifest> {
    if (workspace === this.globalWorkspace || !workspace.uri) {
      workspace.manifestSource = 'bundled'
      return defaultManifest
    }

    const cwd = URI.parse(workspace.uri).fsPath
    let resolution: MasterCSSWorkspacePackageResolution | undefined
    try {
      resolution = resolveMasterCSSWorkspacePackages(cwd)
      workspace.manifestResolution = resolution
      const presetManifestPackage = resolution.presetManifest
      if (!presetManifestPackage) {
        throw new Error('Missing workspace package @master/css-preset/default-manifest.json.')
      }

      const manifest = JSON.parse(await readFile(presetManifestPackage.entry, 'utf8')) as MasterCSSManifest
      workspace.manifestSource = 'workspace'
      this.console.info(`Using workspace Master CSS manifest ${presetManifestPackage.version ?? '(unknown version)'} from ${presetManifestPackage.directory}`)
      if (resolution.errors.length) {
        this.console.info(`Workspace Master CSS manifest optional resolution warnings: ${resolution.errors.map(({ name, message }) => `${name}: ${message}`).join('; ')}`)
      }
      return manifest
    } catch (error) {
      workspace.manifestSource = 'bundled'
      this.console.info(`Using bundled Master CSS manifest for ${workspace.uri}`)
      if (resolution?.errors.length) {
        this.console.info(`Workspace Master CSS package resolution errors: ${resolution.errors.map(({ name, message }) => `${name}: ${message}`).join('; ')}`)
      }
      this.console.error(error instanceof Error ? error.stack || error.message : String(error))
      return defaultManifest
    }
  }

  destroyLanguageService(workspace: Workspace) {
    this.console.info(`Destroyed workspace ${workspace.uri}`)
    workspace.languageService?.dispose()
    delete workspace.languageService
  }

  findClosestWorkspace(textDocumentURI: string) {
    const documentPath = toComparableFilePath(textDocumentURI)
    if (!documentPath) {
      this.console.info(`This is an external document ${textDocumentURI} with the global workspace`)
      return this.globalWorkspace
    }
    let foundWorkspace: Workspace | undefined
    let foundWorkspacePath = ''
    for (const [uri, workspace] of this.workspaces) {
      if (!uri) continue
      const workspacePath = toComparableFilePath(uri)
      if (!workspacePath) continue
      if (containsFilePath(workspacePath, documentPath) && workspacePath.length > foundWorkspacePath.length) {
        foundWorkspace = workspace
        foundWorkspacePath = workspacePath
      }
    }
    if (foundWorkspace) return foundWorkspace
    this.console.info(`This is an external document ${textDocumentURI} with the global workspace`)
    return this.globalWorkspace
  }

  private publishDiagnostics(textDocument: TextDocument, workspace: Workspace) {
    const diagnostics: Diagnostic[] = []
    diagnostics.push(...this.createManifestLoadingDiagnostics(textDocument, workspace))
    diagnostics.push(...this.createCSSDirectiveDiagnostics(textDocument, workspace))

    this.connection.sendDiagnostics({
      uri: textDocument.uri,
      diagnostics
    })
  }

  private createCSSDirectiveDiagnostics(textDocument: TextDocument, workspace: Workspace) {
    if (!isCSSDiagnosticDocument(textDocument)) return []
    const diagnostics: Diagnostic[] = []
    const documentFile = path.resolve(URI.parse(textDocument.uri).fsPath)
    for (const { source, offset } of getCSSDiagnosticSources(textDocument)) {
      try {
        compileCSSManifest(source, {
          from: documentFile,
          baseManifest: workspace.baseManifest ?? defaultManifest
        })
      } catch (error) {
        const directiveError = toCSSDirectiveError(error)
        if (!directiveError) continue
        const diagnostic = this.createCSSDirectiveDiagnostic(directiveError, textDocument, documentFile, offset)
        if (diagnostic) diagnostics.push(diagnostic)
      }
    }
    return diagnostics
  }

  private createManifestLoadingDiagnostics(textDocument: TextDocument, workspace: Workspace): Diagnostic[] {
    if (!workspace.manifestErrors?.length) return []
    const documentFile = path.resolve(URI.parse(textDocument.uri).fsPath)
    return workspace.manifestErrors.map((error) => {
      const directiveError = toCSSDirectiveError(error)
      const source = directiveError?.source
      return {
        range: source && (!source.file || path.resolve(source.file) === documentFile)
          ? this.createCSSDirectiveRange(source, textDocument, documentFile, 0)
          : {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 }
          },
        severity: DiagnosticSeverity.Error,
        code: 'manifest-loading-error',
        source: 'Master CSS',
        message: `Failed to load Master CSS manifest: ${error instanceof Error ? error.message : String(error)}`,
        relatedInformation: directiveError
          ? this.createCSSDirectiveRelatedInformation(directiveError.related, textDocument, documentFile, 0)
          : undefined
      }
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
