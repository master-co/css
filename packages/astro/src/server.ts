import { createServerRenderer, render } from '@master/css-server'
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
  const rendered = render(await response.text(), manifest, { hydrationManifest: 'inject' })
  try {
    return createResponse(response, rendered.html)
  } finally {
    rendered.css?.dispose()
  }
}

export function createMasterCSSMiddleware(manifest: MasterCSSManifest): MiddlewareHandler {
  const renderer = createServerRenderer(manifest)
  return async (_context, next) => {
    const response = await next()
    if (BODYLESS_STATUSES.has(response.status) || !isHTMLResponse(response)) {
      return response
    }
    const rendered = renderer.render(await response.text(), { hydrationManifest: 'inject' })
    try {
      return createResponse(response, rendered.html)
    } finally {
      rendered.css?.dispose()
    }
  }
}
