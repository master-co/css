import { it, test, expect } from 'vitest'
import { createCSS } from '../../../src'

test.concurrent('functions', () => {
    expect(createCSS().create('blur(32)')?.text).toBe('.blur\\(32\\){filter:blur(2rem)}')
    expect(createCSS().create('filter:invert(1)')?.text).toBe('.filter\\:invert\\(1\\){filter:invert(1)}')

    expect(createCSS().create('scale(.2)')?.text).toBe('.scale\\(\\.2\\){transform:scale(0.2)}')
    expect(createCSS().create('translateX(40)')?.text).toBe('.translateX\\(40\\){transform:translateX(2.5rem)}')

    expect(createCSS().create('width:max(0,16)')?.text).toBe('.width\\:max\\(0\\,16\\){width:max(0rem,1rem)}')
    expect(createCSS().create('box-shadow:0|2|3|rgba(0,0,0,.1)')?.text).toBe('.box-shadow\\:0\\|2\\|3\\|rgba\\(0\\,0\\,0\\,\\.1\\){box-shadow:0rem 0.125rem 0.1875rem rgba(0,0,0,0.1)}')

    expect(createCSS().create('grid-template-cols:repeat(2,auto|.6|calc(3-max(2,1)))')?.text).toBe('.grid-template-cols\\:repeat\\(2\\,auto\\|\\.6\\|calc\\(3-max\\(2\\,1\\)\\)\\){grid-template-columns:repeat(2,auto 0.6 calc(0.1875rem - max(2, 1) / 16 * 1rem))}')

    expect(createCSS().create('$primary:black')?.text).toBe('.\\$primary\\:black{--primary:oklch(0% 0 none)}')
    expect(createCSS().create('$primary:black')?.text).toBe('.\\$primary\\:black{--primary:oklch(0% 0 none)}')
})

test.concurrent('checks gradient-related functions with color variables', () => {
    expect(createCSS().create('bg:linear-gradient(0deg,black|0%,white|100%)')?.text).toContain('background-image:linear-gradient(0deg,oklch(0% 0 none) 0%,oklch(100% 0 none) 100%)')
})