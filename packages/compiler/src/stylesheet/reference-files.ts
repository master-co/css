import { isAbsolute } from 'node:path'
import type { CSSDirectiveReference } from '@master/css-schema/css-directives'

/** File paths are host inputs, not CSS URLs. Preserve reserved filename characters. */
export function referenceFileInputs(files: readonly string[] = []): (CSSDirectiveReference & { resolvedFile: string })[] {
  return files.map(file => {
    if (!isAbsolute(file)) throw new TypeError('referenceFiles must contain absolute filesystem paths.')
    return { source: file, resolvedFile: file }
  })
}
