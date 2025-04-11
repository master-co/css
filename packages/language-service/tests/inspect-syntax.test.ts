import { test, it, expect, describe } from 'vitest'
import CSSLanguageService from '../src/core'
import getRange from '../src/utils/get-range'
import createDoc from '../src/utils/create-doc'
import { Position } from 'vscode-languageserver-textdocument'
import dedent from 'ts-dedent'
import { Settings } from '../src'

export const inspect = (target: string, settings: Settings = {}) => {
    const content = `export default () => <div className='${target}'></div>`
    const doc = createDoc('tsx', content)
    const range = getRange(target, doc)
    const languageService = new CSSLanguageService(settings)
    return languageService.inspectSyntax(doc, range?.start as Position)
}

test.concurrent('text:center', async () => {
    const target = 'text:center'
    const hover = inspect(target)
    expect(hover?.contents).toEqual({
        'kind': 'markdown',
        'value': dedent`
            \`\`\`css
            @layer general {
              .text\\:center {
                text-align: center
              }
            }
            \`\`\`

            Describes how inline contents of a block are horizontally aligned if the contents do not completely fill the line box\\.

            (Edge 12, Firefox 1,  4, Safari 1,  1, Chrome 1,  18, IE 3, Opera 3)

            Syntax: start | end | left | right | center | justify | match\\-parent

            [Master CSS](https://rc.css.master.co/reference/text-align) | [MDN Reference](https://developer.mozilla.org/docs/Web/CSS/text-align)
        `
    })
})

test.concurrent('hidden', async () => {
    const target = 'hidden'
    const hover = inspect(target)
    expect(hover?.contents).toEqual({
        'kind': 'markdown',
        'value': dedent`
            \`\`\`css
            @layer general {
              .hidden {
                display: none
              }
            }
            \`\`\`

            The element and its descendants generates no boxes\\.

            [Master CSS](https://rc.css.master.co/reference/display)
        `
    })
})