import { describe, expect, it, vi } from 'vitest'
import { createMasterCSSMiddleware, renderResponse } from '../src/server'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import { MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID } from 'shared/master-css-runtime-manifest'
import type { MasterCSSPlan } from 'shared/master-css-plan'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

describe('Astro server middleware', () => {
    it('renders Master CSS into HTML responses', async () => {
        const middleware = createMasterCSSMiddleware(defaultPlan)
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
        expect(html).toContain(`id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}"`)
        expect(html.match(new RegExp(`id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}"`, 'g'))?.length).toBe(1)
        expect(html).toContain('.block{display:block}')
    })

    it('does not consume non-HTML responses', async () => {
        const response = new Response('{"ok":true}', {
            headers: {
                'content-type': 'application/json'
            }
        })

        expect(await renderResponse(response, defaultPlan)).toBe(response)
        expect(await response.text()).toBe('{"ok":true}')
    })

    it('does not transform bodyless statuses', async () => {
        const response = new Response(null, {
            headers: {
                'content-type': 'text/html'
            },
            status: 304
        })

        expect(await renderResponse(response, defaultPlan)).toBe(response)
    })
})
