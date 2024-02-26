import { createSyncFn } from 'synckit'
import runValidate from './validate.worker'
import { join } from 'path'

export default process.env.NODE_ENV === 'test'
    ? runValidate
    : createSyncFn(join(__dirname, 'validate.worker.cjs')) as typeof runValidate