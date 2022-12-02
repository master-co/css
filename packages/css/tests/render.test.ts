import dedent from 'dedent'
import render from '../src/apis/render'
import renderFromHTML from '../src/apis/render-from-html'
import renderIntoHTML from '../src/apis/render-into-html'

const html = dedent`
    <html>
        <head></head>
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
        .toBe(dedent`
            <html>
                <head><style title="master">.font\:32{font-size:2rem}.text\:center{text-align:center}</style></head>
                <body>
                    <h1 class="text:center font:32">Hello World</h1>
                </body>
            </html>
        `)
})
