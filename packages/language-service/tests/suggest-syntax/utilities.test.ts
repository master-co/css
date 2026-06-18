import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './test'

it.concurrent('types a', () => expect(hint('a')?.find(({ label }) => label === 'abs')).toMatchObject({ label: 'abs' }))
it.concurrent('hints semantic static utilities', () => {
    expect(hint('text-c')?.find(({ label }) => label === 'text-center')).toMatchObject({ label: 'text-center' })
    expect(hint('bg-c')?.find(({ label }) => label === 'bg-cover')).toMatchObject({ label: 'bg-cover' })
    expect(hint('object-c')?.find(({ label }) => label === 'object-cover')).toMatchObject({ label: 'object-cover' })
    expect(hint('b-d')?.find(({ label }) => label === 'b-dashed')).toMatchObject({ label: 'b-dashed' })
    expect(hint('bl-s')?.find(({ label }) => label === 'bl-solid')).toMatchObject({ label: 'bl-solid' })
    expect(hint('border-d')?.find(({ label }) => label === 'border-dashed')).toBeUndefined()
})
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
        `
    }
}))
