import type CSSRuntime from '@master/css-runtime'
import './types/global'

export declare type HookEventCallbackMap = {
    'mutated': (context: {
        classUsages: Map<string, number>,
        cssRuntime: CSSRuntime,
        records: MutationRecord[]
    }) => void
}

export declare type HookEventNames = keyof HookEventCallbackMap

const devToolsHook = {
    listeners: new Map<string, Set<(...args: any[]) => void>>(),
    on<E extends HookEventNames>(event: E, callback: HookEventCallbackMap[E]) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event)?.add(callback as (...args: any[]) => void)
    },
    off<E extends HookEventNames>(event: E, callback: HookEventCallbackMap[E]) {
        this.listeners.get(event)?.delete(callback as (...args: any[]) => void)
    },
    emit<E extends HookEventNames>(event: E, ...args: Parameters<HookEventCallbackMap[E]>) {
        this.listeners.get(event)?.forEach(listener => listener(...args))
    }
}

export declare type DevToolsHook = typeof devToolsHook

export default devToolsHook