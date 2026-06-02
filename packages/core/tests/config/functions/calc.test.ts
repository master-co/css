import { it, expect } from 'vitest'
import createCSSWithTheme from '../../helpers/create-css-with-theme'
it.concurrent('calc', () => {
    expect(createCSSWithTheme().create('line-height:calc(32-16)')?.text).toBe('.line-height\\:calc\\(32-16\\){line-height:calc(32 - 16)}')
    expect(createCSSWithTheme().create('font-size:calc(32-16)')?.text).toBe('.font-size\\:calc\\(32-16\\){font-size:calc(2rem - 1rem)}')
    expect(createCSSWithTheme().create('mt:calc(var(--g-y)*-.1)')?.text).toBe('.mt\\:calc\\(var\\(--g-y\\)\\*-\\.1\\){margin-top:calc(var(--g-y) * -0.1)}')
    expect(createCSSWithTheme().create('mt:calc(var(--g-y)*(-.1))')?.text).toBe('.mt\\:calc\\(var\\(--g-y\\)\\*\\(-\\.1\\)\\){margin-top:calc(var(--g-y) * (-0.1))}')
    expect(createCSSWithTheme().create('mt:calc(var(--g-y)--.1)')?.text).toBe('.mt\\:calc\\(var\\(--g-y\\)--\\.1\\){margin-top:calc(var(--g-y) - -0.00625rem)}')
    expect(createCSSWithTheme().create('mr:calc(var(--g-x)/(-2))')?.text).toBe('.mr\\:calc\\(var\\(--g-x\\)\\/\\(-2\\)\\){margin-right:calc(var(--g-x) / (-2))}')
})

it.concurrent('calc with variables', () => {
    expect(createCSSWithTheme({ variables: [{ key: 'x1', value: 60 }] }).create('w:calc(-2+$(x1))')?.text).toBe('.w\\:calc\\(-2\\+\\$\\(x1\\)\\){width:calc(-0.125rem + var(--x1) / 16 * 1rem)}')
    expect(createCSSWithTheme({ variables: [{ key: '1x', value: 60 }] }).create('w:calc(-2-$(1x))')?.text).toBe('.w\\:calc\\(-2-\\$\\(1x\\)\\){width:calc(-0.125rem - var(--1x) / 16 * 1rem)}')
    expect(createCSSWithTheme({ variables: [{ key: '1x', value: 60 }] }).create('w:calc(-$(1x)-2)')?.text).toBe('.w\\:calc\\(-\\$\\(1x\\)-2\\){width:calc(-var(--1x) / 16 * 1rem - 0.125rem)}')
    expect(createCSSWithTheme({ variables: [{ key: '1x', value: 60 }] }).create('w:calc(-1*($(1x)*2)*3-2)')?.text).toBe('.w\\:calc\\(-1\\*\\(\\$\\(1x\\)\\*2\\)\\*3-2\\){width:calc(-1 * (var(--1x) * 2) * 3 - 0.125rem)}')
    expect(createCSSWithTheme().create('translateX(calc(-25%-2x))')?.text).toBe('.translateX\\(calc\\(-25\\%-2x\\)\\){transform:translateX(calc(-25% - 0.5rem))}')
})
