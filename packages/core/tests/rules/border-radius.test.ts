import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('validates border-radius rules', () => {
    expect(createCSSWithTheme().create('r:16')?.text).toContain('border-radius:1rem')
    expect(createCSSWithTheme().create('border-radius:1rem')?.text).toContain('border-radius:1rem')
    expect(createCSSWithTheme().create('r:lg')?.text).toBe('.r\\:lg{border-radius:calc(var(--radius-lg) / 16 * 1rem)}')
    expect(createCSSWithTheme().create('border-radius:lg')?.text).toBe('.border-radius\\:lg{border-radius:calc(var(--radius-lg) / 16 * 1rem)}')

    expect(createCSSWithTheme().create('rtl:16')?.text).toContain('border-top-left-radius:1rem')
    expect(createCSSWithTheme().create('rtl:lg')?.text).toBe('.rtl\\:lg{border-top-left-radius:calc(var(--radius-lg) / 16 * 1rem)}')
    expect(createCSSWithTheme().create('rtr:16')?.text).toContain('border-top-right-radius:1rem')

    expect(createCSSWithTheme().create('rbl:16')?.text).toContain('border-bottom-left-radius:1rem')
    expect(createCSSWithTheme().create('rbr:16')?.text).toContain('border-bottom-right-radius:1rem')

    expect(createCSSWithTheme().create('rt:16')?.text).toContain('border-top-left-radius:1rem;border-top-right-radius:1rem')
    expect(createCSSWithTheme().create('rb:16')?.text).toContain('border-bottom-left-radius:1rem;border-bottom-right-radius:1rem')
    expect(createCSSWithTheme().create('rl:16')?.text).toContain('border-top-left-radius:1rem;border-bottom-left-radius:1rem')
    expect(createCSSWithTheme().create('rr:16')?.text).toContain('border-top-right-radius:1rem;border-bottom-right-radius:1rem')
})

// it.concurrent('checks border-radius order', () => {
//     expect(createCSSWithTheme().add('rtr:16', 'r:16', 'rl:16', 'rbr:16').rules)
//         .toMatchObject([
//             { className: 'r:16' },
//             { className: 'rl:16' },
//             { className: 'rbr:16' },
//             { className: 'rtr:16' }
//         ])
// })
