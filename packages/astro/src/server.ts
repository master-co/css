import { createServerRenderer, renderHTML } from '@master/css-server'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
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
  const rendered = renderHTML(await response.text(), {
    manifest,
    hydrationManifest: 'inject'
  })
  return createResponse(response, rendered.html)
}

export function createMasterCSSMiddleware(
  manifest: MasterCSSManifest,
  emittedGlobals: MasterCSSEmittedGlobals = {}
): MiddlewareHandler {
  const renderer = createServerRenderer({ manifest, emittedGlobals })
  return async (_context, next) => {
    const response = await next()
    if (BODYLESS_STATUSES.has(response.status) || !isHTMLResponse(response)) {
      return response
    }
    const rendered = renderer.renderHTML(await response.text(), { hydrationManifest: 'inject' })
    return createResponse(response, rendered.html)
  }
}
