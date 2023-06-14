import '../src/polyfills/css-escape'
import dedent from 'ts-dedent'
import { MasterCSS, generateFromClasses, generateFromHTML, renderHTML } from '../src'

const html = dedent`
    <html>
        <head>
            <link rel="styleSheet">
            <style></style>
        </head>
        <body>
            <h1 class="text:center ml:0&gt;:is(a,button):first font:32">Hello World</h1>
        </body>
    </html>
`

it('render', () => {
    expect(generateFromClasses(['text:center', 'font:32'])).toEqual('.font\\:32{font-size:2rem}.text\\:center{text-align:center}')
})

it('renders from HTML', () => {
    expect(generateFromHTML(html))
        .toBe('.font\\:32{font-size:2rem}.ml\\:0\\>\\:is\\(a\\,button\\)\\:first>:is(a,button):first-child{margin-left:0rem}.text\\:center{text-align:center}')
})

const renderedHTML = renderHTML(html)
const expectedRenderedHTML = dedent`
<html>
    <head>
        <link rel="styleSheet">
        <style></style>
    <style id="master">.font\\:32{font-size:2rem}.ml\\:0\\>\\:is\\(a\\,button\\)\\:first>:is(a,button):first-child{margin-left:0rem}.text\\:center{text-align:center}</style></head>
    <body>
        <h1 class="text:center ml:0&gt;:is(a,button):first font:32">Hello World</h1>
    </body>
</html>`

it('renders into HTML', () => {
    expect(renderedHTML).toEqual(expectedRenderedHTML)
})

it('re-renders into HTML where style tags exist', () => {
    expect(renderHTML(renderedHTML))
        .toEqual(expectedRenderedHTML)
})
