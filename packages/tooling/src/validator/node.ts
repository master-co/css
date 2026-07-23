import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '../node'

export function validateClassNamesSync(
  classNames: readonly string[],
  options: { readonly manifest: MasterCSSManifest }
) {
  const session = createToolingSessionSync(options)
  try {
    return session.validateClassNames(classNames)
  } finally {
    session.dispose()
  }
}
