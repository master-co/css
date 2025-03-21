import devToolsHook, { DevToolsHook } from './core'

export default function installHook(global: any = globalThis) {
    const hook = global.__MASTER_CSS_DEVTOOLS_HOOK__ as DevToolsHook
    if (hook) return hook
    return global.__MASTER_CSS_DEVTOOLS_HOOK__ = devToolsHook
}