import { createSyncFn } from 'synckit'
import type { runValidate } from './workers/validate'

const validateAction = createSyncFn(require.resolve('./workers/validate'), {
    tsRunner: 'swc'
}) as typeof runValidate

export default validateAction