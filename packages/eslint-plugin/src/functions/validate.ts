import { createSyncFn } from 'synckit'
import type { runValidate } from './validate.worker.cjs'
import { join } from 'path'

const validate = createSyncFn(join(__dirname, 'validate.worker.cjs'), {
    tsRunner: 'swc'
}) as typeof runValidate

export default validate