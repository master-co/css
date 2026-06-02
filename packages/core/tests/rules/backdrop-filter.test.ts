import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('backdrop-filter', () => {
    expect(createCSSWithTheme().create('bd:drop-shadow(0|2|8|black)')?.text).toBe('.bd\\:drop-shadow\\(0\\|2\\|8\\|black\\){-webkit-backdrop-filter:drop-shadow(0rem 0.125rem 0.5rem var(--color-black));backdrop-filter:drop-shadow(0rem 0.125rem 0.5rem var(--color-black))}')
})
