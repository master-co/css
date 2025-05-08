import { it, expect } from 'vitest'
import { createCSS } from '../../../src'

it.concurrent('calc', () => {
    expect(createCSS().create('line-height:calc(32-16)')?.text).toBe('.line-height\\:calc\\(32-16\\){line-height:calc(32 - 16)}')
    expect(createCSS().create('font-size:calc(32-16)')?.text).toBe('.font-size\\:calc\\(32-16\\){font-size:calc(2rem - 1rem)}')
    expect(createCSS().create('mt:calc(var(--g-y)*-.1)')?.text).toBe('.mt\\:calc\\(var\\(--g-y\\)\\*-\\.1\\){margin-top:calc(var(--g-y) * -0.1)}')
    expect(createCSS().create('mt:calc(var(--g-y)*(-.1))')?.text).toBe('.mt\\:calc\\(var\\(--g-y\\)\\*\\(-\\.1\\)\\){margin-top:calc(var(--g-y) * (-0.1))}')
    expect(createCSS().create('mt:calc(var(--g-y)--.1)')?.text).toBe('.mt\\:calc\\(var\\(--g-y\\)--\\.1\\){margin-top:calc(var(--g-y) - -0.00625rem)}')
    expect(createCSS().create('mr:calc(var(--g-x)/(-2))')?.text).toBe('.mr\\:calc\\(var\\(--g-x\\)\\/\\(-2\\)\\){margin-right:calc(var(--g-x) / (-2))}')
})

it.concurrent('calc with variables', () => {
    expect(createCSS({
        variables: { x1: 60 }
    }).create('w:calc(-2+$(x1))')?.text).toBe('.w\\:calc\\(-2\\+\\$\\(x1\\)\\){width:calc(-0.125rem + 60 / 16 * 1rem)}')
    expect(createCSS({
        variables: { '1x': 60 }
    }).create('w:calc(-2-$(1x))')?.text).toBe('.w\\:calc\\(-2-\\$\\(1x\\)\\){width:calc(-0.125rem - 60 / 16 * 1rem)}')
    expect(createCSS({
        variables: { '1x': 60 }
    }).create('w:calc(-$(1x)-2)')?.text).toBe('.w\\:calc\\(-\\$\\(1x\\)-2\\){width:calc(-60 / 16 * 1rem - 0.125rem)}')
    expect(createCSS({
        variables: { '1x': 60 }
    }).create('w:calc(-1*($(1x)*2)*3-2)')?.text).toBe('.w\\:calc\\(-1\\*\\(\\$\\(1x\\)\\*2\\)\\*3-2\\){width:calc(-1 * (60 * 2) * 3 / 16 * 1rem - 0.125rem)}')
    expect(createCSS().create('translateX(calc(-25%-2x))')?.text).toBe('.translateX\\(calc\\(-25\\%-2x\\)\\){transform:translateX(calc(-25% - 0.5rem))}')
})