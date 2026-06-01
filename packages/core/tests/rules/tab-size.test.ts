import { expect, test } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('tab-size', () => {
    expect(createCSS().create('tab-size:4')?.text).toBe('.tab-size\\:4{tab-size:4}')
    expect(createCSS().create('tab:4')?.text).toBe('.tab\\:4{tab-size:4}')
    expect(createCSS({ variables: [{ namespace: 'tab-size', key: 'github', value: 4 }] }).create('tab:github')?.text).toBe('.tab\\:github{tab-size:var(--tab-size-github)}')
})
