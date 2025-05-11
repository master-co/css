import { it, test, expect } from 'vitest'
import { render } from '../src'

it('render <html>', () => {
    expect(render([
        '<html class="bg:white">',
        '<body><div class="text:center"></div></body>',
        '</html>'
    ].join('')).html).toEqual([
        '<html class="bg:white">',
        '<head><style id="master">@layer base,theme,preset,components,general;@layer general{.bg\\:white{background-color:oklch(100% 0 none)}.text\\:center{text-align:center}}</style></head>',
        '<body><div class="text:center"></div></body>',
        '</html>'
    ].join(''))
})

it('should not render the new style element', () => {
    expect(render([
        '<html class="bg:white">',
        '<head><style id="master"></style></head>',
        '</html>'
    ].join('')).html).toEqual([
        '<html class="bg:white">',
        '<head><style id="master">@layer base,theme,preset,components,general;@layer general{.bg\\:white{background-color:oklch(100% 0 none)}}</style></head>',
        '</html>'
    ].join(''))
})