import { it, test, expect } from 'vitest'
import { render } from '../src'

it('should not encode entities', () => {
    expect(render(
        '<span class="token punctuation">&lt;</span>div<span class="token punctuation">&gt;</span>').html
    ).toContain(
        '<span class="token punctuation">&lt;</span>div<span class="token punctuation">&gt;</span>'
    )
})

test('>', () => {
    expect(render(
        `<div class="mt:0&gt;div"></div>`
    ).html).toEqual([
        '<style id="master">@layer utilities{.mt\\:0\\>div>div{margin-top:0rem}}</style>',
        `<div class="mt:0&gt;div"></div>`
    ].join(''))
})

test('\'', () => {
    expect(render(
        `<div class="font-feature:'salt'"></div>`
    ).html).toEqual([
        `<style id="master">@layer utilities{.font-feature\\:\\'salt\\'{font-feature-settings:'salt'}}</style>`,
        `<div class="font-feature:'salt'"></div>`
    ].join(''))
})