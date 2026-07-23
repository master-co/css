import { loadNativeToolingBackend } from './tooling'
import type { MasterCSSNativeBackendLoadOptions } from './backend-options'
import type {
  MasterCSSToolingBackend,
  MasterCSSToolingBackendSync
} from './broker-tooling-contract'
import { protectToolingSession } from './broker-tooling-adapter'
import { callBackend } from './normalize-error'

export function createNativeToolingBackend(
  options: MasterCSSNativeBackendLoadOptions,
  required: boolean
): MasterCSSToolingBackendSync | undefined {
  const native = loadNativeToolingBackend({ ...options, required })
  if (!native) return
  const bound: MasterCSSToolingBackendSync = {
    backend: 'native',
    createLexerSession: () => protectToolingSession(native.createLexerSession()),
    createSourceSession: () => protectToolingSession(native.createSourceSession()),
    createValidatorSession: (manifest) =>
      protectToolingSession(native.createValidatorSession(manifest)),
    createLanguageSession: (manifest) =>
      protectToolingSession(native.createLanguageSession(manifest)),
    createLintSession: (manifest) =>
      protectToolingSession(native.createLintSession(manifest)),
    createScannerSession: (manifest) =>
      protectToolingSession(native.createScannerSession(manifest)),
    extractClassCandidates: (content) =>
      callBackend('tooling', () => native.extractClassCandidates(content), content),
    extractOxcClasses: (source, content) =>
      callBackend('tooling', () => native.extractOxcClasses(source, content), content),
    extractHTMLClasses: (source, content) =>
      callBackend('tooling', () => native.extractHTMLClasses(source, content), content),
    extractAstroClasses: (source, content) =>
      callBackend('tooling', () => native.extractAstroClasses(source, content), content),
    createInspectionReport: (input) =>
      callBackend('tooling', () => native.createInspectionReport(input))
  }
  return Object.freeze(bound)
}

export function asAsyncToolingBackend(
  backend: MasterCSSToolingBackendSync
): MasterCSSToolingBackend {
  const bound: MasterCSSToolingBackend = {
    backend: backend.backend,
    createLexerSession: async () => backend.createLexerSession(),
    createSourceSession: async () => backend.createSourceSession(),
    createValidatorSession: async (manifest) => backend.createValidatorSession(manifest),
    createLanguageSession: async (manifest) => backend.createLanguageSession(manifest),
    createLintSession: async (manifest) => backend.createLintSession(manifest),
    createScannerSession: async (manifest) => backend.createScannerSession(manifest),
    extractClassCandidates: (content) => backend.extractClassCandidates(content),
    extractOxcClasses: (source, content) => backend.extractOxcClasses(source, content),
    extractHTMLClasses: (source, content) => backend.extractHTMLClasses(source, content),
    extractAstroClasses: (source, content) => backend.extractAstroClasses(source, content),
    createInspectionReport: async (input) => backend.createInspectionReport(input)
  }
  return Object.freeze(bound)
}
