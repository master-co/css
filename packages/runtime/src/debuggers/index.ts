import log from 'shared/utils/log'
import registerClassCountDebugger from './class-count'
import registerLifecycleDebugger from './lifecycle'

export default function startDebuggers() {
    log.info('Debug mode is enabled by default in development.')
    registerClassCountDebugger()
    registerLifecycleDebugger()
}