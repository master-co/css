import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '../node'
import type {
  MasterCSSSourceExtraction,
  MasterCSSSourceExtractionRequest
} from './index'

export function extractSourceSync(
  request: MasterCSSSourceExtractionRequest,
  options: { readonly manifest: MasterCSSManifest }
): MasterCSSSourceExtraction {
  const session = createToolingSessionSync(options)
  try {
    return session.extractSource(request)
  } finally {
    session.dispose()
  }
}
