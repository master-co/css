import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('flex', () => {
    expect(createCSSWithTheme().create('flex:1|1|auto')?.text).toBe('.flex\\:1\\|1\\|auto{flex:1 1 auto}')
    // expect(createCSSWithTheme().create('flex:hover')?.text).toBe('.flex\\:hover{flex: hover}')
})
