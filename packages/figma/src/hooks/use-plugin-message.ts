import { useEffect } from 'react'
import { PluginMessage } from '../types/message'

type Handler<T> = (data: T) => void

export default function usePluginMessage<T>(
    type: PluginMessage['type'],
    handler: Handler<T>
) {
    useEffect(() => {
        const listener = (event: MessageEvent<{ pluginMessage: PluginMessage }>) => {
            const message = event.data.pluginMessage
            if (message?.type === type) {
                handler(message.data as T)
            }
        }

        window.addEventListener('message', listener)
        return () => window.removeEventListener('message', listener)
    }, [type, handler])
}
