import { render } from '../src'

it('render <html>', () => {
    expect(render([
        '<html class="bg:white">',
        '<body><div class="text:center"></div></body>',
        '</html>'
    ].join('')).html).toEqual([
        '<html class="bg:white">',
        '<head><style id="master">.bg\\:white{background-color:rgb(255 255 255)}.text\\:center{text-align:center}</style></head>',
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
        '<head><style id="master">.bg\\:white{background-color:rgb(255 255 255)}</style></head>',
        '</html>'
    ].join(''))
})