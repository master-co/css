import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('transition', () => {
    expect(createCSSWithTheme().create('~transform|.1s|ease-out,width|.1s|ease-out')?.text).toBe('.\\~transform\\|\\.1s\\|ease-out\\,width\\|\\.1s\\|ease-out{transition:transform 0.1s ease-out,width 0.1s ease-out}')
})
