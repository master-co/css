import { readFileSync } from 'node:fs'
import { Plugin } from 'vite'

export async function runTransform(plugin: Plugin, id: string) {
    if (typeof plugin.transform === 'function') {
        return await plugin.transform.call({} as any, readFileSync(id, 'utf-8'), id)
    }
    if (plugin.transform && typeof plugin.transform === 'object' && 'handler' in plugin.transform) {
        return await (plugin.transform.handler as any).call({} as any, readFileSync(id, 'utf-8'), id)
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