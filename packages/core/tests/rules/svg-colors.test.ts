import { expect, test } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('svg color namespace aliases', () => {
    expect(createCSS().create('fill:text-light')?.text).toBe('.fill\\:text-light{fill:var(--color-text-light)}')
    expect(createCSS().create('fill:text-light/.2')?.text).toBe('.fill\\:text-light\\/\\.2{fill:color-mix(in oklab,var(--color-text-light) 20%,transparent)}')
    expect(createCSS().create('stroke:text-light')?.text).toBe('.stroke\\:text-light{stroke:var(--color-text-light)}')
    expect(createCSS().create('stroke:line-lightest')?.text).toBe('.stroke\\:line-lightest{stroke:var(--color-line-lightest)}')
})
