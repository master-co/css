import { createSyncFn } from 'synckit'
import type { runReorderValidClasses } from './reorder-valid-classes.worker.js'
import { join } from 'path'

const reorderValidClasses = createSyncFn(join(__dirname, 'reorder-valid-classes.worker')) as typeof runReorderValidClasses

export default reorderValidClasses