import { createSyncFn } from 'synckit'
import runReorderValidClasses from './reorder-valid-classes.worker'
import { join } from 'path'

export default process.env.NODE_ENV === 'test'
    ? runReorderValidClasses
    : createSyncFn(join(__dirname, 'reorder-valid-classes.worker.cjs')) as typeof runReorderValidClasses