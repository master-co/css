import { test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('box-shadow', () => {
    expect(createCSS().create('box-shadow:8|8|10|#00b0de')?.text).toContain('box-shadow:0.5rem 0.5rem 0.625rem #00b0de')
    expect(createCSS().create('box-shadow:8|8|10|var(--my-shadow,#00b0de)')?.text).toContain('box-shadow:0.5rem 0.5rem 0.625rem var(--my-shadow,#00b0de)')
})

test.concurrent('uses shadow variables', () => {
    expect(createCSS().create('shadow:xs')?.text).toBe('.shadow\\:xs{box-shadow:0rem 1px 2px oklch(0% 0 none / 0.08)}')
    expect(createCSS().create('box-shadow:2xl')?.text).toContain('box-shadow:0rem 16px 24px -8px oklch(0% 0 none / 0.12), 0rem 32px 64px -16px oklch(0% 0 none / 0.16)')
    expect(createCSS({ variables: { shadow: { custom: '0 4px 12px black' } } }).create('shadow:custom')?.text).toBe('.shadow\\:custom{box-shadow:0rem 4px 12px oklch(0% 0 none)}')
})
