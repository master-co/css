import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('content', () => {
    expect(createCSS().create('content:\'fo\\\'o\'')?.text).toContain('content:\'fo\\\'o\'')
})

test.concurrent('variable', () => {
    expect(createCSS({ variables: [{ namespace: 'content', key: 'external', value: '" ↗"' }] }).create('content:external:after')?.text).toBe('.content\\:external\\:after:after{content:" ↗"}')
})