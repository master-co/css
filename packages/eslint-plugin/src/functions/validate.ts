import { createSyncFn } from 'synckit'
import type { runValidate } from './validate.worker.js'
import { join } from 'path'

const validate = createSyncFn(join(__dirname, 'validate.worker')) as typeof runValidate

export default validate