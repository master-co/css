import '../src/polyfills/css-escape'
import dedent from 'ts-dedent'
import { MasterCSS } from '../src'

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

it('class to string', () => {
    const css = new MasterCSS()
    for (const eachClass of ['text:center', 'font:32']) {
        css.insert(eachClass)
    }
    expect(css.text).toEqual('.font\\:32{font-size:2rem}.text\\:center{text-align:center}')
})
