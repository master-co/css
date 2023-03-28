import '../src/polyfills/css-escape'
import dedent from 'dedent'
import { render, renderFromHTML, renderIntoHTML } from '../src/methods'

const html = dedent`
    <html>
        <head>
            <link rel="styleSheet">
            <style></style>
        </head>
        <body>
            <h1 class="text:center font:32">Hello World</h1>
        </body>
    </html>
`

test('render', () => {
    expect(render(['text:center', 'font:32']))
        .toBe('.font\\:32{font-size:2rem}.text\\:center{text-align:center}')

    expect(renderFromHTML(html))
        .toBe('.font\\:32{font-size:2rem}.text\\:center{text-align:center}')

    expect(renderIntoHTML(html))
        .toBe(dedent`<html>
        <head>
            <link rel="styleSheet">
            <style></style>
        </head>
        <body>
            <h1 class="text:center font:32">Hello World</h1>
        <style title="master">.font\:32{font-size:2rem}.text\:center{text-align:center}</style></body>
    </html>`)

    expect(renderIntoHTML(html, { precedence: 'higher' }))
        .toBe(dedent`<html>
        <head>
            <link rel="styleSheet">
            <style></style>
        <style title="master">.font\:32{font-size:2rem}.text\:center{text-align:center}</style></head>
        <body>
            <h1 class="text:center font:32">Hello World</h1>
        </body>
    </html>`)
    expect(renderIntoHTML(html, { precedence: 'lowest' }))
        .toBe(dedent`<html>
        <head>
            <style title="master">.font\:32{font-size:2rem}.text\:center{text-align:center}</style><link rel="styleSheet">
            <style></style>
        </head>
        <body>
            <h1 class="text:center font:32">Hello World</h1>
        </body>
    </html>`)
})
