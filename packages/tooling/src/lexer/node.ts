import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '../node'
import type {
  MasterCSSClassListAnalysis,
  MasterCSSClassListAnalysisRequest
} from './index'

export function analyzeClassListSync(
  request: MasterCSSClassListAnalysisRequest,
  options: { readonly manifest: MasterCSSManifest }
): MasterCSSClassListAnalysis {
  const session = createToolingSessionSync(options)
  try {
    return session.analyzeClassList(request)
  } finally {
    session.dispose()
  }
}
