import log from 'shared/utils/log'

export default function registerLifecycleDebugger() {
    const hook = globalThis.__MASTER_CSS_DEVTOOLS_HOOK__

    hook.on('runtime:created', ({ cssRuntime }) => {
        log.debug('created', cssRuntime)
    })

    hook.on('runtime:hydrated', ({ cssRuntime }) => {
        log.debug('hydrated', cssRuntime)
    })

    hook.on('runtime:observed', ({ cssRuntime }) => {
        log.debug('observed', cssRuntime)
        if (cssRuntime.progressive) {
            log.info('Progressive rendering is adopted.')
            log.debug('pre-rendered CSS', cssRuntime.style)
        } else {
            log.info('Runtime rendering is adopted.')
        }
    })

    hook.on('runtime:refreshed', ({ cssRuntime, customConfig }) => {
        log.debug('refreshed', cssRuntime, customConfig)
    })

    hook.on('runtime:disconnected', ({ cssRuntime }) => {
        log.debug('disconnected', cssRuntime)
    })

    hook.on('runtime:destroyed', ({ cssRuntime }) => {
        log.debug('destroyed', cssRuntime)
    })
}