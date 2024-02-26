import { createSyncFn } from 'synckit'
import type { runValidRules } from './valid-rules.worker.js'
import { join } from 'path'

const validRules = createSyncFn(join(__dirname, 'valid-rules.worker')) as typeof runValidRules

export default validRules