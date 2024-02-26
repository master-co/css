import { createSyncFn } from 'synckit'
import runValidRules from './valid-rules.worker'
import { join } from 'path'

export default process.env.NODE_ENV === 'test'
    ? runValidRules
    : createSyncFn(join(__dirname, 'valid-rules.worker.cjs')) as typeof runValidRules