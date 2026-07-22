import { describe, expect, it, vi } from 'vitest'
import { createMasterCSSMiddleware, renderResponse } from '../src/server'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID } from '@master/css-schema/hydration-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

describe('Astro server middleware', () => {
  it('renders Master CSS into HTML responses', async () => {
    const middleware = createMasterCSSMiddleware(defaultManifest)
    const response = await middleware({} as never, vi.fn(async () => {
      return new Response(
        '<html><head></head><body><div class="block"></div></body></html>',
        {
          headers: {
            'content-length': '999',
            'content-type': 'text/html; charset=utf-8'
          }
        }
      )
    }) as never) as Response

    const html = await response.text()

    expect(response.headers.get('content-length')).toBeNull()
    expect(html).toContain('<style id="master-css">')
    expect(html).toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
    expect(html.match(new RegExp(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`, 'g'))?.length).toBe(1)
    expect(html).toContain('.block{display:block}')
  })

  it('keeps middleware page output isolated across responses', async () => {
    const middleware = createMasterCSSMiddleware(defaultManifest)
    const renderHTML = async (html: string) => {
      const response = await middleware({} as never, vi.fn(async () => new Response(html, {
        headers: { 'content-type': 'text/html' }
      })) as never) as Response
      return response.text()
    }

    const first = await renderHTML('<html><head></head><body><div class="fg:red"></div></body></html>')
    const second = await renderHTML('<html><head></head><body><div class="fg:blue"></div></body></html>')

    expect(first).toContain('.fg\\:red')
    expect(first).not.toContain('.fg\\:blue')
    expect(second).toContain('.fg\\:blue')
    expect(second).not.toContain('.fg\\:red')
  })

  it('does not consume non-HTML responses', async () => {
    const response = new Response('{"ok":true}', {
      headers: {
        'content-type': 'application/json'
      }
    })

    expect(await renderResponse(response, defaultManifest)).toBe(response)
    expect(await response.text()).toBe('{"ok":true}')
  })

  it('does not transform bodyless statuses', async () => {
    const response = new Response(null, {
      headers: {
        'content-type': 'text/html'
      },
      status: 304
    })

    expect(await renderResponse(response, defaultManifest)).toBe(response)
  })
})
