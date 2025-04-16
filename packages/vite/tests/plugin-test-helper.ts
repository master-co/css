import { Plugin } from 'vite'

export async function runLoad(plugin: Plugin, id: string) {
    if (typeof plugin.load === 'function') {
        return await plugin.load.call({} as any, id)
    }
    if (plugin.load && typeof plugin.load === 'object' && 'handler' in plugin.load) {
        return await (plugin.load.handler as any).call({} as any, id)
    }
    throw new Error('plugin.transform is not a callable function')
}

export async function runTransformIndexHtml(plugin: Plugin, html: string) {
    if (typeof plugin.transformIndexHtml === 'function') {
        const result = await plugin.transformIndexHtml.call({} as any, html, {} as any)
        return typeof result === 'string' ? result : (result && 'html' in result ? result.html : undefined)
    }
    throw new Error('transformIndexHtml is not defined')
}