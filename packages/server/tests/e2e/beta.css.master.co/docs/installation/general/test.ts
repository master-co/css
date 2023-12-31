import { render } from '../../../../../../src'
import fs from 'fs'
import path from 'path'

const html = fs.readFileSync(path.join(__dirname, './document.html'), 'utf8')
const rendered = render(html)

it('basic', () => {
    expect(rendered.html).toContain('.\\{font\\:mono\\;font-feature\\:normal\\}_\\:where\\(code\\,kbd\\,samp\\)')
})