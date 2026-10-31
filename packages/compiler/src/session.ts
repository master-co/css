import { assertValidationOptions } from './value-validation'
import {
  createCompilerBindingSession as createBindingSession,
  type MasterCSSBindingLoadOptions,
  type MasterCSSCompilerBindingSession,
  type MasterCSSDirectiveCompileOptions,
  type MasterCSSLowerDirectivesOptions,
  type MasterCSSLowerDirectivesRequest
} from '@master/css-binding/compiler'
import type { CompileCSSOptions, CompileCSSResult } from './contracts'

export interface BindingCompilerSession {
  readonly binding: MasterCSSCompilerBindingSession['binding']
  compareProjectSnapshots: MasterCSSCompilerBindingSession['compareProjectSnapshots']
  inspectCSS: MasterCSSCompilerBindingSession['inspectCSS']
  compileCSS(source: string, options?: CompileCSSOptions): CompileCSSResult
  lowerCSSDirectives: MasterCSSCompilerBindingSession['lowerCSSDirectives']
  prepareCSSStylesheetBundle: MasterCSSCompilerBindingSession['prepareCSSStylesheetBundle']
  renderCSSStylesheetBundle: MasterCSSCompilerBindingSession['renderCSSStylesheetBundle']
  compileCSSStylesheetGraph(
    request: Parameters<MasterCSSCompilerBindingSession['compileCSSStylesheetGraph']>[0]
  ): Omit<ReturnType<MasterCSSCompilerBindingSession['compileCSSStylesheetGraph']>, 'directives'> & {
    directives: CompileCSSResult
  }
  dispose(): void
}

function reviveCompileResult(result: CompileCSSResult) {
  result.extractionPolicy.blocklist = result.extractionPolicy.blocklist.map((entry) => {
    if (entry && typeof entry === 'object' && 'source' in entry && typeof entry.source === 'string') {
      return new RegExp(entry.source, 'flags' in entry && typeof entry.flags === 'string' ? entry.flags : '')
    }
    return entry
  })
  return result
}

function bindCompilerSession(session: MasterCSSCompilerBindingSession): BindingCompilerSession {
  return {
    binding: session.binding,
    compareProjectSnapshots: (request) => session.compareProjectSnapshots(request),
    inspectCSS: (source: string) => session.inspectCSS(source),
    compileCSS(source, options = {}) {
      assertValidationOptions(options)
      return reviveCompileResult(session.compileCSSDirectives(source, {
        from: options.from || 'master.css',
        preserveNativeCSS: options.preserveNativeCSS !== false,
        pruneNativeCSS: options.pruneNativeCSS === true,
        ...(options.preserveNativeSource === undefined ? {} : { preserveNativeSource: options.preserveNativeSource }),
        ...(options.classes ? { classes: options.classes } : {})
      }) as CompileCSSResult)
    },
    lowerCSSDirectives: (
      request: MasterCSSLowerDirectivesRequest,
      options?: MasterCSSLowerDirectivesOptions,
      sourceText?: string
    ) =>
      session.lowerCSSDirectives(request, options, sourceText),
    prepareCSSStylesheetBundle: (request) => session.prepareCSSStylesheetBundle(request),
    renderCSSStylesheetBundle: (request) => session.renderCSSStylesheetBundle(request),
    compileCSSStylesheetGraph(request) {
      const result = session.compileCSSStylesheetGraph(request)
      return { ...result, directives: reviveCompileResult(result.directives as CompileCSSResult) }
    },
    dispose: () => session.dispose()
  }
}

export async function createCompilerBindingSession(
  options: MasterCSSBindingLoadOptions = {}
): Promise<BindingCompilerSession> {
  return bindCompilerSession(await createBindingSession(options))
}

/** @internal */
export function bindCompilerBindingSessionInternal(
  session: MasterCSSCompilerBindingSession
): BindingCompilerSession {
  return bindCompilerSession(session)
}
