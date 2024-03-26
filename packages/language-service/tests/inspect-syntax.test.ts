import CSSLanguageService from '../src/core'
import getRange from '../src/utils/get-range'
import createDoc from '../src/utils/create-doc'
import { Position } from 'vscode-languageserver-textdocument'
import dedent from 'ts-dedent'

test('generated CSS', async () => {
    const target = 'text:center'
    const content = `export default () => <div className='${target}'></div>`
    const doc = createDoc('tsx', content)
    const range = getRange(target, doc)
    const languageService = new CSSLanguageService()
    const hover = await languageService.inspectSyntax(doc, range?.start as Position)
    expect(hover?.contents).toStrictEqual([
        {
            language: 'css',
            value: dedent`
                .text\\:center {
                  text-align: center
                }
            `
        },
        dedent`
            Describes how inline contents of a block are horizontally aligned if the contents do not completely fill the line box\\.

            (Edge 12, Firefox 1, Safari 1, Chrome 1, IE 3, Opera 3)

            Syntax: start | end | left | right | center | justify | match\\-parent

            Reference: [Master CSS](https://rc.css.master.co/docs/text-align) | [MDN](https://developer.mozilla.org/docs/Web/CSS/text-align)
        `
    ])
    expect(hover?.range).toStrictEqual(range)
})

// todo: share with the getMainClassPosition.ts logic
test.todo('get CSS data by semantic')