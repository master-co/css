import { createSyncFn } from 'synckit'
import type { runReorderValidClasses } from './workers/reorder-valid-classes'

const reorderValidClassesAction = createSyncFn(require.resolve('./workers/reorder-valid-classes'), {
    tsRunner: 'swc'
}) as typeof runReorderValidClasses

export default reorderValidClassesAction