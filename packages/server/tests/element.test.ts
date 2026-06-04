import { it, test, expect } from 'vitest'
import { render } from '../src'

it('render elements', () => {
    expect(render([
        '<div class="text:center"></div>',
        '<div class="bg:white"></div>'
    ].join('')).html).toEqual([
        '<style id="master">@layer utilities{.bg\\:white{background:white}.text\\:center{text-align:center}}</style>',
        '<div class="text:center"></div>',
        '<div class="bg:white"></div>'
    ].join(''))
})
