import { describe, expect, it, vi } from 'vitest'
import { createMasterCSSMiddleware, renderResponse } from '../src/server'

describe('Astro server middleware', () => {
    it('renders Master CSS into HTML responses', async () => {
        const middleware = createMasterCSSMiddleware()
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
        expect(html).toContain('<style id="master">')
        expect(html).toContain('.block{display:block}')
    })

    it('does not consume non-HTML responses', async () => {
        const response = new Response('{"ok":true}', {
            headers: {
                'content-type': 'application/json'
            }
        })

        expect(await renderResponse(response)).toBe(response)
        expect(await response.text()).toBe('{"ok":true}')
    })

    it('does not transform bodyless statuses', async () => {
        const response = new Response(null, {
            headers: {
                'content-type': 'text/html'
            },
            status: 304
        })

        expect(await renderResponse(response)).toBe(response)
    })
})
