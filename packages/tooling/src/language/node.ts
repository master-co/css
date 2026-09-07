import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '../node'
import type {
  MasterCSSDocumentAnalysis,
  MasterCSSDocumentAnalysisRequest,
  MasterCSSFormatDirectivesRequest,
  MasterCSSFormatDirectivesResult
} from './index'

export function analyzeDocumentSync(
  request: MasterCSSDocumentAnalysisRequest,
  options: { readonly manifest: MasterCSSManifest }
): MasterCSSDocumentAnalysis {
  const session = createToolingSessionSync(options)
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
  const session = createToolingSessionSync(options)
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
  const session = createToolingSessionSync(options)
  try {
    return session.formatDirectives(request)
  } finally {
    session.dispose()
  }
}
