// @vitest-environment jsdom
import { describe, expect, test } from 'vitest'
import hydrate from '../../hydrate'

describe('general', async () => {
    const { runtimeCSS } = await hydrate(import.meta.url)

    test.concurrent('base', () => {
        expect(runtimeCSS.generalLayer.rules[0]).toMatchObject({
            name: 'content:external::after',
            nodes: [
                {
                    native: { selectorText: '.content\\:external\\:after:after' },
                    text: '.content\\:external\\:after:after{content:" ↗"}'
                }
            ]
        })
    })

    test.concurrent('group selectors', () => {
        expect(runtimeCSS.generalLayer.rules[1]).toMatchObject({
            name: 'block::before,::after',
            nodes: [
                {
                    native: { selectorText: '.block\\:\\:before\\,\\:\\:after::before,.block\\:\\:before\\,\\:\\:after::after' },
                    text: '.block\\:\\:before\\,\\:\\:after::before,.block\\:\\:before\\,\\:\\:after::after{display:block}',
                    suffixSelectors: ['::before', '::after']
                }
            ]
        })
    })

    test.concurrent('merge N native rules into 1 rule', () => {
        expect(runtimeCSS.generalLayer.rules[2]).toMatchObject({
            name: 'hidden::slider-thumb',
            nodes: [
                {
                    native: { selectorText: '.hidden\\:\\:slider-thumb::-webkit-slider-thumb' },
                    text: '.hidden\\:\\:slider-thumb::-webkit-slider-thumb{display:none}',
                    suffixSelectors: ['::-webkit-slider-thumb']
                }
            ]
        })
    })
})


