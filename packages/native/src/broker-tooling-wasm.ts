import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import { assertMasterCSSBackendInfo } from './binding'
import type { MasterCSSWasmBackendLoadOptions } from './backend-options'
import type {
  MasterCSSLexerBackendSession,
  MasterCSSLintBackendSession,
  MasterCSSLanguageBackendSession,
  MasterCSSScannerBackendSession,
  MasterCSSSourceBackendSession,
  MasterCSSToolingBackend,
  MasterCSSToolingBackendSession,
  MasterCSSValidatorBackendSession
} from './broker-tooling-contract'
import type {
  MasterCSSBackendInfo,
  MasterCSSDiagnosticsReportInput,
  MasterCSSInspectionReport,
  MasterCSSLintClassList
} from './protocol'
import { protectToolingSession } from './broker-tooling-adapter'
import {
  callBackend,
  callBackendAsync
} from './normalize-error'

type ProviderSession<T extends MasterCSSToolingBackendSession> =
  Omit<T, typeof Symbol.dispose>

type MasterCSSLintWasmProviderSession =
  Omit<ProviderSession<MasterCSSLintBackendSession>, 'analyzeClassListPolicy'>
  & Readonly<{
    analyzeClassListPolicy(requestJSON: string): MasterCSSLintClassList
  }>

export interface MasterCSSToolingWasmProviderContract {
  readonly info: MasterCSSBackendInfo
  createLexerSession(): Promise<ProviderSession<MasterCSSLexerBackendSession>>
  createSourceSession(): Promise<ProviderSession<MasterCSSSourceBackendSession>>
  createValidatorSession(manifestJSON: string): Promise<Readonly<{
    nativeDeclarationCandidates: MasterCSSValidatorBackendSession['nativeDeclarationCandidates']
    generateClasses: MasterCSSValidatorBackendSession['generateClassRules']
    dispose(): void
  }>>
  createLanguageSession(
    manifestJSON: string
  ): Promise<ProviderSession<MasterCSSLanguageBackendSession>>
  createLintSession(
    manifestJSON: string
  ): Promise<MasterCSSLintWasmProviderSession>
  createScannerSession(manifestJSON: string): Promise<Readonly<{
    scan: MasterCSSScannerBackendSession['scan']
    extractCandidates: MasterCSSScannerBackendSession['extractCandidates']
    nativeDeclarationCandidates: MasterCSSScannerBackendSession['nativeDeclarationCandidates']
    collectCandidates: MasterCSSScannerBackendSession['collectCandidates']
    filterCandidates: MasterCSSScannerBackendSession['filterCandidates']
    invalidGeneratedClasses: MasterCSSScannerBackendSession['invalidGeneratedClasses']
    scanCandidates: MasterCSSScannerBackendSession['scanCandidates']
    ensureClasses: MasterCSSScannerBackendSession['ensureClassRules']
    registerNativeClasses: MasterCSSScannerBackendSession['registerNativeClassNames']
    reset: MasterCSSScannerBackendSession['reset']
    state: MasterCSSScannerBackendSession['snapshot']
    dispose(): void
  }>>
  extractClassCandidates(content: string): readonly string[]
  extractOxcClasses(source: string, content: string): readonly string[]
  extractHTMLClasses(source: string, content: string): readonly string[]
  extractAstroClasses(source: string, content: string): readonly string[]
  createInspectionReport(input: MasterCSSDiagnosticsReportInput): Promise<MasterCSSInspectionReport>
}

export type MasterCSSToolingWasmProviderFactory = (
  options?: MasterCSSWasmBackendLoadOptions
) => Promise<object>

async function loadDefaultWasmProvider(options: MasterCSSWasmBackendLoadOptions | undefined) {
  const { createMasterCSSToolingWasmProvider } = await import('@master/css-wasm-tooling')
  return await createMasterCSSToolingWasmProvider(options)
}

function withLifecycle<T extends { dispose(): void }>(session: T) {
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    session.dispose()
  }
  return { dispose, [Symbol.dispose]: dispose }
}

export async function createWasmToolingBackend(
  options: MasterCSSWasmBackendLoadOptions | undefined,
  providerFactory: MasterCSSToolingWasmProviderFactory = loadDefaultWasmProvider
): Promise<MasterCSSToolingBackend> {
  const wasm = await providerFactory(options) as MasterCSSToolingWasmProviderContract
  assertMasterCSSBackendInfo(wasm.info, {
    surface: 'tooling',
    features: ['diagnostics', 'language', 'lint', 'scanner', 'source', 'validator']
  })
  const bound: MasterCSSToolingBackend = {
    backend: 'wasm',
    async createLexerSession(): Promise<MasterCSSLexerBackendSession> {
      const session = await callBackendAsync('tooling', () => wasm.createLexerSession())
      const bound: MasterCSSLexerBackendSession = {
        ...withLifecycle(session),
        analyze: (request) => session.analyze(request)
      }
      return protectToolingSession(Object.freeze(bound))
    },
    async createSourceSession(): Promise<MasterCSSSourceBackendSession> {
      const session = await callBackendAsync('tooling', () => wasm.createSourceSession())
      const bound: MasterCSSSourceBackendSession = {
        ...withLifecycle(session),
        extract: (request) => session.extract(request)
      }
      return protectToolingSession(Object.freeze(bound))
    },
    async createValidatorSession(manifest): Promise<MasterCSSValidatorBackendSession> {
      const session = await callBackendAsync(
        'tooling',
        () => wasm.createValidatorSession(serializeMasterCSSManifest(manifest))
      )
      const bound: MasterCSSValidatorBackendSession = {
        ...withLifecycle(session),
        nativeDeclarationCandidates: (classNames) =>
          session.nativeDeclarationCandidates([...classNames]),
        generateClassRules: (classNames, nativeSupport) =>
          session.generateClasses([...classNames], nativeSupport ? [...nativeSupport] : undefined)
      }
      return protectToolingSession(Object.freeze(bound))
    },
    async createLanguageSession(manifest): Promise<MasterCSSLanguageBackendSession> {
      const session = await callBackendAsync(
        'tooling',
        () => wasm.createLanguageSession(serializeMasterCSSManifest(manifest))
      )
      const bound: MasterCSSLanguageBackendSession = {
        ...withLifecycle(session),
        analyzeDocument: (request) => session.analyzeDocument(request),
        formatDirectives: (request) => session.formatDirectives(request),
        nativeDeclarationCandidates: (classNames) =>
          session.nativeDeclarationCandidates([...classNames]),
        classifyClassNames: (classNames, nativeSupport) =>
          session.classifyClassNames([...classNames], nativeSupport ? [...nativeSupport] : undefined),
        inspectClassName: (className, nativeSupport, mode) =>
          session.inspectClassName(className, nativeSupport ? [...nativeSupport] : undefined, mode),
        completionIndex: () => session.completionIndex(),
        colorPresentation: (colorToken) => session.colorPresentation(colorToken),
        colorTokens: (candidates) => session.colorTokens(candidates as never[])
      }
      return protectToolingSession(Object.freeze(bound))
    },
    async createLintSession(manifest): Promise<MasterCSSLintBackendSession> {
      const session = await callBackendAsync(
        'tooling',
        () => wasm.createLintSession(serializeMasterCSSManifest(manifest))
      )
      const bound: MasterCSSLintBackendSession = {
        ...withLifecycle(session),
        nativeDeclarationCandidates: (classNames) =>
          session.nativeDeclarationCandidates([...classNames]),
        resolveValidation: (batch, ruleErrors) =>
          session.resolveValidation(batch, ruleErrors as string[][][]),
        canonicalClassNames: (classNames, nativeSupport, lintOptions) =>
          session.canonicalClassNames([...classNames], nativeSupport ? [...nativeSupport] : undefined, lintOptions),
        canonicalClassGroups: (classNames, nativeSupport, lintOptions) =>
          session.canonicalClassGroups([...classNames], nativeSupport ? [...nativeSupport] : undefined, lintOptions),
        canonicalComposeDirective: (classNames, nativeSupport, lintOptions) =>
          session.canonicalComposeDirective([...classNames], nativeSupport ? [...nativeSupport] : undefined, lintOptions),
        rawValueCandidates: (classNames, nativeSupport, invalidGeneratedClasses) =>
          session.rawValueCandidates([...classNames], nativeSupport ? [...nativeSupport] : undefined, [...invalidGeneratedClasses]),
        analyze: (classNames, nativeSupport, invalidGeneratedClasses) =>
          session.analyze([...classNames], nativeSupport ? [...nativeSupport] : undefined, [...invalidGeneratedClasses]),
        analyzeClassList: (classList, classNames, nativeSupport, invalidGeneratedClasses) =>
          session.analyzeClassList(classList, [...classNames], nativeSupport ? [...nativeSupport] : undefined, [...invalidGeneratedClasses]),
        analyzeClassListPolicy: (request) =>
          session.analyzeClassListPolicy(typeof request === 'string' ? request : JSON.stringify(request))
      }
      return protectToolingSession(Object.freeze(bound))
    },
    async createScannerSession(manifest): Promise<MasterCSSScannerBackendSession> {
      const session = await callBackendAsync(
        'tooling',
        () => wasm.createScannerSession(serializeMasterCSSManifest(manifest))
      )
      const bound: MasterCSSScannerBackendSession = {
        ...withLifecycle(session),
        scan: (source, content) => session.scan(source, content),
        extractCandidates: (source, content) => session.extractCandidates(source, content),
        nativeDeclarationCandidates: (candidates) =>
          session.nativeDeclarationCandidates([...candidates]),
        collectCandidates: (candidates) => session.collectCandidates([...candidates]),
        filterCandidates: (candidates, blocklist) =>
          session.filterCandidates([...candidates], blocklist),
        invalidGeneratedClasses: (batch, ruleSupport) =>
          session.invalidGeneratedClasses(batch, ruleSupport.map((values) => [...values])),
        scanCandidates: (
          source,
          content,
          candidates,
          blocklist,
          nativeSupport,
          invalidGeneratedClasses
        ) => session.scanCandidates(
          source,
          content,
          [...candidates],
          blocklist,
          [...nativeSupport],
          [...invalidGeneratedClasses]
        ),
        ensureClassRules: (classNames) => session.ensureClasses([...classNames]),
        registerNativeClassNames: (classNames) => session.registerNativeClasses([...classNames]),
        reset: () => session.reset(),
        snapshot: () => session.state()
      }
      return protectToolingSession(Object.freeze(bound))
    },
    extractClassCandidates: (content) =>
      callBackend('tooling', () => wasm.extractClassCandidates(content), content),
    extractOxcClasses: (source, content) =>
      callBackend('tooling', () => wasm.extractOxcClasses(source, content), content),
    extractHTMLClasses: (source, content) =>
      callBackend('tooling', () => wasm.extractHTMLClasses(source, content), content),
    extractAstroClasses: (source, content) =>
      callBackend('tooling', () => wasm.extractAstroClasses(source, content), content),
    createInspectionReport: (input) =>
      callBackendAsync('tooling', () => wasm.createInspectionReport(input))
  }
  return Object.freeze(bound)
}
