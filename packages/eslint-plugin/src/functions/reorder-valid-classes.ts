import { createSyncFn } from 'synckit'
import type { runReorderValidClasses } from './reorder-valid-classes.worker.cjs'
import { join } from 'path'

const reorderValidClasses = createSyncFn(join(__dirname, 'reorder-valid-classes.worker.cjs'), {
    tsRunner: 'swc'
}) as typeof runReorderValidClasses

export default reorderValidClasses