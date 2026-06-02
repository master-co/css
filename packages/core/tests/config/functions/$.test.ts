import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../../helpers/create-css-with-theme'
test.concurrent('variable', () => {
    expect(createCSSWithTheme({ variables: [{ key: 'placement', value: 'center' }] }).create('text-align:$(placement)')?.text).toBe('.text-align\\:\\$\\(placement\\){text-align:var(--placement)}')
})

it.concurrent('falls back to native if not found', () => {
    expect(createCSSWithTheme().create('text-align:$(placement)')?.text).toBe('.text-align\\:\\$\\(placement\\){text-align:var(--placement)}')
})
