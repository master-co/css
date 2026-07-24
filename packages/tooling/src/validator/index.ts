import type { MasterCSSBinding } from '@master/css-binding'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSession } from '../tooling-session'
import type { MasterCSSClassValidationResult } from './contracts'

export type {
  MasterCSSClassValidation,
  MasterCSSClassValidationResult
} from './contracts'

export async function validateClassNames(
  classNames: readonly string[],
  options: {
    readonly manifest: MasterCSSManifest
    readonly binding?: MasterCSSBinding
  }
): Promise<MasterCSSClassValidationResult> {
  const session = await createToolingSession(options)
  try {
    return session.validateClassNames(classNames)
  } finally {
    session.dispose()
  }
}
