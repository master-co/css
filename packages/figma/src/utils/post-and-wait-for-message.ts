import { PluginMessage, PluginMessageMap } from '../types/message'
import post from './post'

const pendingRequests = new Map<string, AbortController>()

export default function postAndWaitForMessage<T extends PluginMessage['type']>(
    type: T,
    payload: PluginMessageMap[T],
    timeout = 5000
): Promise<PluginMessageMap[T]> {
    const controller = new AbortController()

    // Cancel any pending request of same type
    if (pendingRequests.has(type)) {
        pendingRequests.get(type)?.abort()
    }
    pendingRequests.set(type, controller)

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            window.removeEventListener('message', handler)
            reject(new Error(`Timeout waiting for message "${type}"`))
        }, timeout)

        const handler = (event: MessageEvent<{ pluginMessage: PluginMessage }>) => {
            const message = event.data.pluginMessage
            if (message.type === type) {
                clearTimeout(timer)
                window.removeEventListener('message', handler)
                resolve(message.data as T)
            }
        }

        controller.signal.addEventListener('abort', () => {
            clearTimeout(timer)
            window.removeEventListener('message', handler)
            reject(new Error(`Request "${type}" was aborted`))
        })

        window.addEventListener('message', handler)
        post(type, payload)
    })
}
