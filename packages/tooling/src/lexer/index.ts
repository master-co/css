import type { MasterCSSBackend } from '@master/css-backend'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSession } from '../tooling-session'
import type {
  MasterCSSClassListAnalysis,
  MasterCSSClassListAnalysisRequest
} from './contracts'

export type {
  MasterCSSCSSAnalysis,
  MasterCSSCSSDirectiveAnalysis,
  MasterCSSCSSImportAnalysis,
  MasterCSSClassListAnalysis,
  MasterCSSClassListAnalysisRequest,
  MasterCSSClassListInput,
  MasterCSSClassListItem,
  MasterCSSSourceRange
} from './contracts'

export async function analyzeClassList(
  request: MasterCSSClassListAnalysisRequest,
  options: {
    readonly manifest: MasterCSSManifest
    readonly backend?: MasterCSSBackend
  }
): Promise<MasterCSSClassListAnalysis> {
  const session = await createToolingSession(options)
  try {
    return session.analyzeClassList(request)
  } finally {
    session.dispose()
  }
}
