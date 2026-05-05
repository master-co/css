import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './test'
import { Settings } from '../../src'

const settings: Settings = {
    config: {
        components: {
            btn: ['inline-block']
        }
    }
}
it.concurrent('info', () => expect(hint('b', settings)?.find(({ label }) => label === 'btn')).toMatchObject({
    detail: 'inline-block (style)',
    documentation: {
        kind: 'markdown',
        value: dedent`
            \`\`\`css
            @layer components {
              .btn {
                display: inline-block
              }
            }
            \`\`\`

            [Master CSS](https://rc.css.master.co/guide/components)
        `
    }
}))
it.concurrent('types btn: and should not hint', () => expect(hint('btn:', settings)).toBe(undefined))
