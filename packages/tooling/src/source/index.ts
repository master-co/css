import type { MasterCSSBinding } from '@master/css-binding'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSession } from '../tooling-session'
import type {
  MasterCSSSourceExtraction,
  MasterCSSSourceExtractionRequest
} from './contracts'

export type {
  MasterCSSExtractedSource,
  MasterCSSSourceExtraction,
  MasterCSSSourceExtractionInput,
  MasterCSSSourceExtractionRequest,
  MasterCSSSourceKind
} from './contracts'

export async function extractSource(
  request: MasterCSSSourceExtractionRequest,
  options: {
    readonly manifest: MasterCSSManifest
    readonly binding?: MasterCSSBinding
  }
): Promise<MasterCSSSourceExtraction> {
  const session = await createToolingSession(options)
  try {
    return session.extractSource(request)
  } finally {
    session.dispose()
  }
}
