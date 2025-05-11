import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './test'
import { CompletionItemKind } from 'vscode-languageserver-protocol'

test.todo('convert any color spaces to RGB and hint correctly')

it.concurrent('should ignore values containing blanks', () => expect(hint('font-family:')?.map(({ label }) => label)).not.toContain('Arial, Helvetica, sans-serif'))
it.concurrent('types | delimiter', () => expect(hint('b:1|')?.map(({ label }) => label)).toContain('solid'))
it.concurrent('types , separator', () => expect(hint('s:1|1|2|black,')?.map(({ label }) => label)).toContain('inset'))
it.concurrent('ends with @ and not to hint values', () => expect(hint('text:center@')?.map(({ label }) => label)).not.toContain('center'))
it.concurrent('ends with : and not to hint values', () => expect(hint('text:center:')?.map(({ label }) => label)).not.toContain('center'))

describe.concurrent('ambiguous', () => {
    test.concurrent('text:capitalize', () => expect(hint('text:')?.map(({ label }) => label)).toContain('capitalize'))
    test.concurrent('text:center', () => expect(hint('text:')?.map(({ label }) => label)).toContain('center'))
})

describe.concurrent('detail and documentation', () => {
    test.concurrent('font:', () => expect(hint('font:')?.find(({ label }) => label === 'sans')).toEqual({
        detail: '(scope) ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
        kind: CompletionItemKind.Value,
        label: 'sans',
        sortText: 'aaaasans',
        documentation: {
            kind: 'markdown',
            value: dedent`
                    \`\`\`css
                    @layer general {
                      .font\\:sans {
                        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji
                      }
                    }
                    \`\`\`

                    Specifies a prioritized list of font family names or generic family names\\. A user agent iterates through the list of family names until it matches an available font that contains a glyph for the character to be rendered\\.

                    (Edge 12, Firefox 1,  4, Safari 1,  1, Chrome 1,  18, IE 3, Opera 3)

                    Syntax: &lt;family\\-name&gt;\\#

                    [Master CSS](https://rc.css.master.co/reference/font-family) | [MDN Reference](https://developer.mozilla.org/docs/Web/CSS/font-family)
                `
        }
    }))
    test.concurrent('font-style:', () => expect(hint('font-style:')?.find(({ label }) => label === 'italic')).toEqual({
        detail: 'font-style: italic',
        kind: 12,
        label: 'italic',
        sortText: 'cccccitalic',
        documentation: {
            kind: 'markdown',
            value: dedent`
                    \`\`\`css
                    @layer general {
                      .font-style\\:italic {
                        font-style: italic
                      }
                    }
                    \`\`\`

                    Selects a font that is labeled as an 'italic' face, or an 'oblique' face if one is not

                    [Master CSS](https://rc.css.master.co/reference/font-style) | [MDN Reference](https://developer.mozilla.org/docs/Web/CSS/font-style)
                `
        }
    }))
})

describe.concurrent('retype on no hints', () => {
    it.concurrent('"text:c"', () => expect(hint('text:c')?.length).toBeGreaterThan(0))
    it.concurrent('"d:b"', () => expect(hint('d:b')?.find(({ label }) => label === 'block')).toEqual({
        label: 'block',
        kind: 12,
        sortText: 'cccccblock',
        detail: 'display: block',
        documentation: {
            kind: 'markdown',
            value: dedent`
                    \`\`\`css
                    @layer general {
                      .d\\:block {
                        display: block
                      }
                    }
                    \`\`\`

                    The element generates a block\\-level box

                    [Master CSS](https://rc.css.master.co/reference/display) | [MDN Reference](https://developer.mozilla.org/docs/Web/CSS/display)
                `
        }
    }))
})

describe.concurrent('negative values', () => {
    it.concurrent('should hint negative values', () => expect(hint('font:')?.map(({ label }) => label)).not.toContain('-bold'))
    test.todo('types - to hint number values')
})

describe.concurrent('sorting', () => {
    test.concurrent('colors', () => {
        expect(
            hint('fg:')
                ?.filter(({ label }) => label.startsWith('yellow'))
                ?.map(({ label }) => label)
        ).toEqual([
            'yellow',
            'yellow-0',
            'yellow-5',
            'yellow-10',
            'yellow-20',
            'yellow-30',
            'yellow-40',
            'yellow-50',
            'yellow-60',
            'yellow-70',
            'yellow-80',
            'yellow-90',
            'yellow-95',
            'yellow-100',
            'yellow-active',
            'yellow-text'
        ])
    })
})

describe.concurrent('functions', () => {
    test.todo('fucntions')
})