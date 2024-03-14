import { createSyncFn } from 'synckit'
import runFilterCollisionClasses from './filter-collision-classes.worker'
import { join } from 'path'

export default process.env.NODE_ENV === 'test'
    ? runFilterCollisionClasses
    : createSyncFn(join(__dirname, 'filter-collision-classes.worker.cjs')) as typeof runFilterCollisionClasses