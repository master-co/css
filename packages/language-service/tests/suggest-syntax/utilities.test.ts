import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './test'

it.concurrent('types a', () => expect(hint('a')?.find(({ label }) => label === 'abs')).toMatchObject({ label: 'abs' }))
test.concurrent('info', () => expect(hint('b')?.find(({ label }) => label === 'block')).toMatchObject({
    detail: 'display: block',
    documentation: {
        kind: 'markdown',
        value: dedent`
            \`\`\`css
            @layer utilities {
              .block {
                display: block
              }
            }
            \`\`\`

            The element generates a block\\-level box

            (Edge 12, Firefox 1,  4, Safari 1,  1, Chrome 1,  18, IE 4, Opera 7)

            [Master CSS](https://rc.css.master.co/reference/display)
        `
    }
}))
