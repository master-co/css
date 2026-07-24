import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import { assertMasterCSSBindingInfo } from './binding'
import type { MasterCSSWasmBindingLoadOptions } from './binding-options'
import type {
  MasterCSSLexerBindingSession,
  MasterCSSLintBindingSession,
  MasterCSSLanguageBindingSession,
  MasterCSSScannerBindingSession,
  MasterCSSSourceBindingSession,
  MasterCSSToolingBinding,
  MasterCSSToolingBindingSession,
  MasterCSSValidatorBindingSession
} from './tooling-binding-contract'
import type {
  MasterCSSBindingInfo,
  MasterCSSDiagnosticsReportInput,
  MasterCSSInspectionReport,
  MasterCSSLintClassList
} from './protocol'
import { protectToolingSession } from './tooling-binding-adapter'
import {
  callBinding,
  callBindingAsync
} from './normalize-error'

type ProviderSession<T extends MasterCSSToolingBindingSession> =
  Omit<T, typeof Symbol.dispose>

type MasterCSSLintWasmProviderSession =
  Omit<ProviderSession<MasterCSSLintBindingSession>, 'analyzeClassListPolicy'>
  & Readonly<{
    analyzeClassListPolicy(requestJSON: string): MasterCSSLintClassList
  }>

export interface MasterCSSToolingWasmProviderContract {
  readonly info: MasterCSSBindingInfo
  createLexerSession(): Promise<ProviderSession<MasterCSSLexerBindingSession>>
  createSourceSession(): Promise<ProviderSession<MasterCSSSourceBindingSession>>
  createValidatorSession(manifestJSON: string): Promise<Readonly<{
    nativeDeclarationCandidates: MasterCSSValidatorBindingSession['nativeDeclarationCandidates']
    generateClasses: MasterCSSValidatorBindingSession['generateClassRules']
    dispose(): void
  }>>
  createLanguageSession(
    manifestJSON: string
  ): Promise<ProviderSession<MasterCSSLanguageBindingSession>>
  createLintSession(
    manifestJSON: string
  ): Promise<MasterCSSLintWasmProviderSession>
  createScannerSession(manifestJSON: string): Promise<Readonly<{
    scan: MasterCSSScannerBindingSession['scan']
    extractCandidates: MasterCSSScannerBindingSession['extractCandidates']
    nativeDeclarationCandidates: MasterCSSScannerBindingSession['nativeDeclarationCandidates']
    collectCandidates: MasterCSSScannerBindingSession['collectCandidates']
    filterCandidates: MasterCSSScannerBindingSession['filterCandidates']
    invalidGeneratedClasses: MasterCSSScannerBindingSession['invalidGeneratedClasses']
    scanCandidates: MasterCSSScannerBindingSession['scanCandidates']
    ensureClasses: MasterCSSScannerBindingSession['ensureClassRules']
    registerNativeClasses: MasterCSSScannerBindingSession['registerNativeClassNames']
    reset: MasterCSSScannerBindingSession['reset']
    state: MasterCSSScannerBindingSession['snapshot']
    dispose(): void
  }>>
  extractClassCandidates(content: string): readonly string[]
  extractOxcClasses(source: string, content: string): readonly string[]
  extractHTMLClasses(source: string, content: string): readonly string[]
  extractAstroClasses(source: string, content: string): readonly string[]
  createInspectionReport(input: MasterCSSDiagnosticsReportInput): Promise<MasterCSSInspectionReport>
}

export type MasterCSSToolingWasmProviderFactory = (
  options?: MasterCSSWasmBindingLoadOptions
) => Promise<object>

async function loadDefaultWasmProvider(options: MasterCSSWasmBindingLoadOptions | undefined) {
  const { createMasterCSSToolingWasmProvider } = await import('@master/css-binding-wasm-tooling')
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

export async function createWasmToolingBinding(
  options: MasterCSSWasmBindingLoadOptions | undefined,
  providerFactory: MasterCSSToolingWasmProviderFactory = loadDefaultWasmProvider
): Promise<MasterCSSToolingBinding> {
  const wasm = await providerFactory(options) as MasterCSSToolingWasmProviderContract
  assertMasterCSSBindingInfo(wasm.info, {
    surface: 'tooling',
    features: ['diagnostics', 'language', 'lint', 'scanner', 'source', 'validator']
  })
  const bound: MasterCSSToolingBinding = {
    binding: 'wasm',
    async createLexerSession(): Promise<MasterCSSLexerBindingSession> {
      const session = await callBindingAsync('tooling', () => wasm.createLexerSession())
      const bound: MasterCSSLexerBindingSession = {
        ...withLifecycle(session),
        analyze: (request) => session.analyze(request)
      }
      return protectToolingSession(Object.freeze(bound))
    },
    async createSourceSession(): Promise<MasterCSSSourceBindingSession> {
      const session = await callBindingAsync('tooling', () => wasm.createSourceSession())
      const bound: MasterCSSSourceBindingSession = {
        ...withLifecycle(session),
        extract: (request) => session.extract(request)
      }
      return protectToolingSession(Object.freeze(bound))
    },
    async createValidatorSession(manifest): Promise<MasterCSSValidatorBindingSession> {
      const session = await callBindingAsync(
        'tooling',
        () => wasm.createValidatorSession(serializeMasterCSSManifest(manifest))
      )
      const bound: MasterCSSValidatorBindingSession = {
        ...withLifecycle(session),
        nativeDeclarationCandidates: (classNames) =>
          session.nativeDeclarationCandidates([...classNames]),
        generateClassRules: (classNames, nativeSupport) =>
          session.generateClasses([...classNames], nativeSupport ? [...nativeSupport] : undefined)
      }
      return protectToolingSession(Object.freeze(bound))
    },
    async createLanguageSession(manifest): Promise<MasterCSSLanguageBindingSession> {
      const session = await callBindingAsync(
        'tooling',
        () => wasm.createLanguageSession(serializeMasterCSSManifest(manifest))
      )
      const bound: MasterCSSLanguageBindingSession = {
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
    async createLintSession(manifest): Promise<MasterCSSLintBindingSession> {
      const session = await callBindingAsync(
        'tooling',
        () => wasm.createLintSession(serializeMasterCSSManifest(manifest))
      )
      const bound: MasterCSSLintBindingSession = {
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
    async createScannerSession(manifest): Promise<MasterCSSScannerBindingSession> {
      const session = await callBindingAsync(
        'tooling',
        () => wasm.createScannerSession(serializeMasterCSSManifest(manifest))
      )
      const bound: MasterCSSScannerBindingSession = {
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
      callBinding('tooling', () => wasm.extractClassCandidates(content), content),
    extractOxcClasses: (source, content) =>
      callBinding('tooling', () => wasm.extractOxcClasses(source, content), content),
    extractHTMLClasses: (source, content) =>
      callBinding('tooling', () => wasm.extractHTMLClasses(source, content), content),
    extractAstroClasses: (source, content) =>
      callBinding('tooling', () => wasm.extractAstroClasses(source, content), content),
    createInspectionReport: (input) =>
      callBindingAsync('tooling', () => wasm.createInspectionReport(input))
  }
  return Object.freeze(bound)
}
