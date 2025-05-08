import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('validates border-radius rules', () => {
    expect(createCSS().create('r:16')?.text).toContain('border-radius:1rem')
    expect(createCSS().create('border-radius:1rem')?.text).toContain('border-radius:1rem')

    expect(createCSS().create('rtl:16')?.text).toContain('border-top-left-radius:1rem')
    expect(createCSS().create('rtr:16')?.text).toContain('border-top-right-radius:1rem')

    expect(createCSS().create('rbl:16')?.text).toContain('border-bottom-left-radius:1rem')
    expect(createCSS().create('rbr:16')?.text).toContain('border-bottom-right-radius:1rem')

    expect(createCSS().create('rt:16')?.text).toContain('border-top-left-radius:1rem;border-top-right-radius:1rem')
    expect(createCSS().create('rb:16')?.text).toContain('border-bottom-left-radius:1rem;border-bottom-right-radius:1rem')
    expect(createCSS().create('rl:16')?.text).toContain('border-top-left-radius:1rem;border-bottom-left-radius:1rem')
    expect(createCSS().create('rr:16')?.text).toContain('border-top-right-radius:1rem;border-bottom-right-radius:1rem')
})

// it.concurrent('checks border-radius order', () => {
//     expect(createCSS().add('rtr:16', 'r:16', 'rl:16', 'rbr:16').rules)
//         .toMatchObject([
//             { className: 'r:16' },
//             { className: 'rl:16' },
//             { className: 'rbr:16' },
//             { className: 'rtr:16' }
//         ])
// })