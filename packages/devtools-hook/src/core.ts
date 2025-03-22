import type EventCallbacks from './types/event-callbacks'
import type EventNames from './types/event-names'

const devToolsHook = {
    listeners: new Map<string, Set<(...args: any[]) => void>>(),
    on<E extends EventNames>(event: E, callback: EventCallbacks[E]) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event)?.add(callback as (...args: any[]) => void)
    },
    off<E extends EventNames>(event: E, callback: EventCallbacks[E]) {
        this.listeners.get(event)?.delete(callback as (...args: any[]) => void)
    },
    emit<E extends EventNames>(event: E, ...args: Parameters<EventCallbacks[E]>) {
        this.listeners.get(event)?.forEach(listener => listener(...args))
    }
}

export declare type DevToolsHook = typeof devToolsHook

export default devToolsHook