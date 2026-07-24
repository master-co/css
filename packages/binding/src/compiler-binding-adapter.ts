import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSDiagnosticDomain } from '@master/css-schema'
import type { MasterCSSCompilerBindingSession } from './compiler-binding-contract'
import { callBinding } from './normalize-error'

interface CompilerOperations {
  findManifestEntries?: MasterCSSCompilerBindingSession['findManifestEntries']
  loadProjectManifest?: MasterCSSCompilerBindingSession['loadProjectManifest']
  loadPreparedProjectManifest?: MasterCSSCompilerBindingSession['loadPreparedProjectManifest']
  inspectCSS: MasterCSSCompilerBindingSession['inspectCSS']
  compileNativeCSS: MasterCSSCompilerBindingSession['compileNativeCSS']
  compileCSSDirectives: MasterCSSCompilerBindingSession['compileCSSDirectives']
  compileThemeCSS: MasterCSSCompilerBindingSession['compileThemeCSS']
  analyzeCSSDependencies: MasterCSSCompilerBindingSession['analyzeCSSDependencies']
  analyzeStandaloneDirectives: MasterCSSCompilerBindingSession['analyzeStandaloneDirectives']
  mergeCSSExtractionPolicies: MasterCSSCompilerBindingSession['mergeCSSExtractionPolicies']
  filterCSSExtractionCandidates: MasterCSSCompilerBindingSession['filterCSSExtractionCandidates']
  compileManifestInput: MasterCSSCompilerBindingSession['compileManifestInput']
  lowerCSSDirectives: MasterCSSCompilerBindingSession['lowerCSSDirectives']
  normalizeManifest: MasterCSSCompilerBindingSession['normalizeManifest']
  normalizeDefaultManifest: MasterCSSCompilerBindingSession['normalizeDefaultManifest']
  compileDefaultPresetManifest: MasterCSSCompilerBindingSession['compileDefaultPresetManifest']
  resolveCSSImportGraph: MasterCSSCompilerBindingSession['resolveCSSImportGraph']
  createInspectionReport?: MasterCSSCompilerBindingSession['createInspectionReport']
  renderClassNames?: MasterCSSCompilerBindingSession['renderClassNames']
  dispose?: () => void
}

function unavailable(operation: string): never {
  throw new MasterCSSError({
    code: 'NATIVE_UNAVAILABLE',
    domain: 'compiler',
    message: `${operation} requires the Master CSS native Node binding.`
  })
}

export function bindCompilerBindingSession(
  binding: MasterCSSCompilerBindingSession['binding'],
  operations: CompilerOperations
): MasterCSSCompilerBindingSession {
  let disposed = false
  const invoke = <T>(
    domain: MasterCSSDiagnosticDomain,
    operation: () => T,
    source?: string
  ) => {
    if (disposed) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'compiler',
        message: 'The Master CSS compiler binding session has been disposed.'
      })
    }
    return callBinding(domain, operation, source)
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    operations.dispose?.()
  }
  const session: MasterCSSCompilerBindingSession = {
    binding,
    findManifestEntries: (projectDir) => invoke('project', () =>
      operations.findManifestEntries?.(projectDir) ?? unavailable('Project discovery')),
    loadProjectManifest: (projectDir, baseManifest, entries) => invoke('project', () =>
      operations.loadProjectManifest?.(projectDir, baseManifest, entries)
        ?? unavailable('Project manifest loading')),
    loadPreparedProjectManifest: (projectDir, baseManifest, graphs) => invoke('project', () =>
      operations.loadPreparedProjectManifest?.(projectDir, baseManifest, graphs)
        ?? unavailable('Prepared project manifest loading')),
    inspectCSS: (source) => invoke('compiler', () => operations.inspectCSS(source), source),
    compileNativeCSS: (source, options) =>
      invoke('compiler', () => operations.compileNativeCSS(source, options), source),
    compileCSSDirectives: (source, options) =>
      invoke('compiler', () => operations.compileCSSDirectives(source, options), source),
    compileThemeCSS: (source, options) =>
      invoke('compiler', () => operations.compileThemeCSS(source, options), source),
    analyzeCSSDependencies: (source) =>
      invoke('compiler', () => operations.analyzeCSSDependencies(source), source),
    analyzeStandaloneDirectives: (source) =>
      invoke('compiler', () => operations.analyzeStandaloneDirectives(source), source),
    mergeCSSExtractionPolicies: (policies) =>
      invoke('compiler', () => operations.mergeCSSExtractionPolicies(policies)),
    filterCSSExtractionCandidates: (candidates, blocklist) =>
      invoke('compiler', () => operations.filterCSSExtractionCandidates(candidates, blocklist)),
    compileManifestInput: (input, options) =>
      invoke('compiler', () => operations.compileManifestInput(input, options)),
    lowerCSSDirectives: (request, options, sourceText) =>
      invoke('compiler', () => operations.lowerCSSDirectives(request, options), sourceText),
    normalizeManifest: (manifest) =>
      invoke('compiler', () => operations.normalizeManifest(manifest)),
    normalizeDefaultManifest: (manifest) =>
      invoke('compiler', () => operations.normalizeDefaultManifest(manifest)),
    compileDefaultPresetManifest: (request) =>
      invoke('compiler', () => operations.compileDefaultPresetManifest(request)),
    resolveCSSImportGraph: (request) =>
      invoke('compiler', () => operations.resolveCSSImportGraph(request)),
    createInspectionReport: (input) => invoke('tooling', () =>
      operations.createInspectionReport?.(input) ?? unavailable('Inspection reporting')),
    renderClassNames: (manifest, classNames, nativeSupport) => invoke('server', () =>
      operations.renderClassNames?.(manifest, classNames, nativeSupport)
        ?? unavailable('Native class rendering')),
    dispose,
    [Symbol.dispose]: dispose
  }
  return Object.freeze(session)
}
