import { loadNativeToolingBinding } from './tooling'
import type { MasterCSSNativeBindingLoadOptions } from './binding-options'
import type {
  MasterCSSToolingBinding,
  MasterCSSToolingBindingSync
} from './tooling-binding-contract'
import { protectToolingSession } from './tooling-binding-adapter'
import { callBinding } from './normalize-error'

export function createNativeToolingBinding(
  options: MasterCSSNativeBindingLoadOptions,
  required: boolean
): MasterCSSToolingBindingSync | undefined {
  const native = loadNativeToolingBinding({ ...options, required })
  if (!native) return
  const bound: MasterCSSToolingBindingSync = {
    binding: 'native',
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
      callBinding('tooling', () => native.extractClassCandidates(content), content),
    extractOxcClasses: (source, content) =>
      callBinding('tooling', () => native.extractOxcClasses(source, content), content),
    extractHTMLClasses: (source, content) =>
      callBinding('tooling', () => native.extractHTMLClasses(source, content), content),
    extractAstroClasses: (source, content) =>
      callBinding('tooling', () => native.extractAstroClasses(source, content), content),
    createInspectionReport: (input) =>
      callBinding('tooling', () => native.createInspectionReport(input))
  }
  return Object.freeze(bound)
}

export function asAsyncToolingBinding(
  binding: MasterCSSToolingBindingSync
): MasterCSSToolingBinding {
  const bound: MasterCSSToolingBinding = {
    binding: binding.binding,
    createLexerSession: async () => binding.createLexerSession(),
    createSourceSession: async () => binding.createSourceSession(),
    createValidatorSession: async (manifest) => binding.createValidatorSession(manifest),
    createLanguageSession: async (manifest) => binding.createLanguageSession(manifest),
    createLintSession: async (manifest) => binding.createLintSession(manifest),
    createScannerSession: async (manifest) => binding.createScannerSession(manifest),
    extractClassCandidates: (content) => binding.extractClassCandidates(content),
    extractOxcClasses: (source, content) => binding.extractOxcClasses(source, content),
    extractHTMLClasses: (source, content) => binding.extractHTMLClasses(source, content),
    extractAstroClasses: (source, content) => binding.extractAstroClasses(source, content),
    createInspectionReport: async (input) => binding.createInspectionReport(input)
  }
  return Object.freeze(bound)
}
