import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '../node'

export function lintClassNamesSync(
  classNames: readonly string[],
  options: { readonly manifest: MasterCSSManifest }
) {
  const session = createToolingSessionSync(options)
  try {
    return session.lintClassNames(classNames)
  } finally {
    session.dispose()
  }
}
