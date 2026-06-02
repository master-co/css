import { expect, test } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('svg color namespace aliases', () => {
    expect(createCSSWithTheme().create('fill:text-light')?.text).toBe('.fill\\:text-light{fill:var(--color-text-light)}')
    expect(createCSSWithTheme().create('fill:text-light/.2')?.text).toBe('.fill\\:text-light\\/\\.2{fill:color-mix(in oklab,var(--color-text-light) 20%,transparent)}')
    expect(createCSSWithTheme().create('stroke:text-light')?.text).toBe('.stroke\\:text-light{stroke:var(--color-text-light)}')
    expect(createCSSWithTheme().create('stroke:line-lightest')?.text).toBe('.stroke\\:line-lightest{stroke:var(--color-line-lightest)}')
})
