import log from 'shared/utils/log'

export default function registerLifecycleDebugger() {
    const hook = globalThis.__MASTER_CSS_DEVTOOLS_HOOK__

    hook.on('runtime:created', ({ cssRuntime }) => {
        log.debug('Runtime created:', cssRuntime)
    })

    hook.on('runtime:hydrated', ({ cssRuntime }) => {
        log.debug('Runtime hydrated:', cssRuntime)
    })

    hook.on('runtime:observed', ({ cssRuntime }) => {
        log.debug('Runtime observed:', cssRuntime)
    })

    hook.on('runtime:refreshed', ({ cssRuntime, customConfig }) => {
        log.debug('Runtime refreshed:', cssRuntime, customConfig)
    })

    hook.on('runtime:disconnected', ({ cssRuntime }) => {
        log.debug('Runtime disconnected:', cssRuntime)
    })

    hook.on('runtime:destroyed', ({ cssRuntime }) => {
        log.debug('Runtime destroyed:', cssRuntime)
    })
}