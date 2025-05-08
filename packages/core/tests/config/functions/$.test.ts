import { it, test, expect } from 'vitest'
import { createCSS } from '../../../src'

test.concurrent('variable', () => {
    expect(createCSS({ variables: { placement: 'center' } }).create('text-align:$(placement)')?.text).toBe('.text-align\\:\\$\\(placement\\){text-align:center}')
})

it.concurrent('falls back to native if not found', () => {
    expect(createCSS().create('text-align:$(placement)')?.text).toBe('.text-align\\:\\$\\(placement\\){text-align:var(--placement)}')
})