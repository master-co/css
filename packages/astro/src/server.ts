import { render } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css'
import type { MiddlewareHandler } from 'astro'

const BODYLESS_STATUSES = new Set([204, 205, 304])

export function isHTMLResponse(response: Response) {
    return response.headers.get('content-type')?.toLowerCase().includes('text/html') || false
}

export function createResponse(response: Response, body: BodyInit | null) {
    const headers = new Headers(response.headers)
    headers.delete('content-length')
    return new Response(body, {
        headers,
        status: response.status,
        statusText: response.statusText
    })
}

export async function renderResponse(response: Response, manifest: MasterCSSManifest) {
    if (BODYLESS_STATUSES.has(response.status) || !isHTMLResponse(response)) {
        return response
    }
    return createResponse(response, render(await response.text(), manifest, { hydrationManifest: 'inject' }).html)
}

export function createMasterCSSMiddleware(manifest: MasterCSSManifest): MiddlewareHandler {
    return async (_context, next) => {
        return await renderResponse(await next(), manifest)
    }
}
