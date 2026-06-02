import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('text-overflow', () => {
    expect(createCSSWithTheme().create('text:clip')?.text).toContain('text-overflow:clip')
    expect(createCSSWithTheme().create('text-overflow:clip')?.text).toContain('text-overflow:clip')

    expect(createCSSWithTheme().create('text:ellipsis')?.text).toContain('text-overflow:ellipsis')
    expect(createCSSWithTheme().create('text-overflow:ellipsis')?.text).toContain('text-overflow:ellipsis')
})