import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingBindingSync } from '@master/css-binding/tooling/node'
import { bindLanguageSession, type LanguageSession } from './session'
import type {
  MasterCSSDocumentAnalysis,
  MasterCSSDocumentAnalysisRequest,
  MasterCSSFormatDirectivesRequest,
  MasterCSSFormatDirectivesResult
} from './index'

export type { LanguageSession as MasterCSSLanguageSession } from './session'

/**
 * Create a reusable native language-only session synchronously.
 * Results are immutable snapshots. Dispose the session when its owner is finished.
 */
export function createLanguageSessionSync(options: {
  readonly manifest: MasterCSSManifest
}): LanguageSession {
  const binding = createToolingBindingSync()
  return bindLanguageSession(binding.binding, binding.createLanguageSession(options.manifest))
}

export function analyzeDocumentSync(
  request: MasterCSSDocumentAnalysisRequest,
  options: { readonly manifest: MasterCSSManifest }
): MasterCSSDocumentAnalysis {
  const session = createLanguageSessionSync(options)
  try {
    return session.analyzeDocument(request)
  } finally {
    session.dispose()
  }
}

export function inspectClassNameSync(
  className: string,
  options: {
    readonly manifest: MasterCSSManifest
    readonly mode?: string
  }
) {
  const session = createLanguageSessionSync(options)
  try {
    return session.inspectClassName(className, options.mode)
  } finally {
    session.dispose()
  }
}

export function formatDirectivesSync(
  request: MasterCSSFormatDirectivesRequest,
  options: { readonly manifest: MasterCSSManifest }
): MasterCSSFormatDirectivesResult {
  const session = createLanguageSessionSync(options)
  try {
    return session.formatDirectives(request)
  } finally {
    session.dispose()
  }
}
