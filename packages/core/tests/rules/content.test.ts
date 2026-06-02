import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('content', () => {
    expect(createCSSWithTheme().create('content:\'fo\\\'o\'')?.text).toContain('content:\'fo\\\'o\'')
})

test.concurrent('variable', () => {
    expect(createCSSWithTheme({ variables: [{ namespace: 'content', key: 'external', value: '" ↗"' }] }).create('content:external:after')?.text).toBe('.content\\:external\\:after:after{content:var(--content-external)}')
})
