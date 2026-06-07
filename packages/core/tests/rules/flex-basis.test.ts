import { test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'

test.concurrent('container variables', () => {
    expect(createCSSWithTheme().create('flex-basis:md')?.text).toBe('.flex-basis\\:md{flex-basis:calc(var(--container-md) / 16 * 1rem)}')
})
