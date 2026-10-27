import { createHash } from 'node:crypto'
import { cleanStylesheetModuleRequest } from '@master/css-internal/style-module'

export function stylesheetSlot(id: string) {
  const hash = createHash('sha256').update(cleanStylesheetModuleRequest(id)).digest('hex').slice(0, 20)
  return `#master-css-entry-${hash}{--slot:0}`
}
