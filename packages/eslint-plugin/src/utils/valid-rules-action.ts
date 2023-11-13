import { createSyncFn } from 'synckit'
import type { runValidRules } from './workers/valid-rules'

const validRulesAction = createSyncFn(require.resolve('./workers/valid-rules'), {
    tsRunner: 'swc'
}) as typeof runValidRules

export default validRulesAction