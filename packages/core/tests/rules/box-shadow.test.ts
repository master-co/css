import { test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('box-shadow', () => {
    expect(createCSS().create('box-shadow:8|8|10|#00b0de')?.text).toContain('box-shadow:0.5rem 0.5rem 0.625rem #00b0de')
    expect(createCSS().create('box-shadow:8|8|10|var(--my-shadow,#00b0de)')?.text).toContain('box-shadow:0.5rem 0.5rem 0.625rem var(--my-shadow,#00b0de)')
})

test.concurrent('uses shadow variables', () => {
    expect(createCSS().create('shadow:xs')?.text).toBe('.shadow\\:xs{box-shadow:var(--shadow-xs)}')
    expect(createCSS().create('box-shadow:2xl')?.text).toContain('box-shadow:var(--shadow-2xl)')
    expect(createCSS({ variables: [{ namespace: 'shadow', key: 'custom', value: '0 4px 12px black' }] }).create('shadow:custom')?.text).toBe('.shadow\\:custom{box-shadow:var(--shadow-custom)}')
})
