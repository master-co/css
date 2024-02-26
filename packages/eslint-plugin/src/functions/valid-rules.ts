import { createSyncFn } from 'synckit'
import type { runValidRules } from './valid-rules.worker.cjs'
import { join } from 'path'

const validRules = createSyncFn(join(__dirname, 'valid-rules.worker.cjs'), {
    tsRunner: 'swc'
}) as typeof runValidRules

export default validRules