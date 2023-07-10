import { MasterCSS, initRuntime } from '../src'
import delay from 'shared/utils/delay'
import { complexHTML } from './complex-html'

let css: MasterCSS

beforeAll(() => {
    css = initRuntime()
})

/**
 * <p class="block font:bold">
 * <p class="block font:bold italic">
 */
it('css count class add', async () => {
    const p1 = document.createElement('p')
    p1.classList.add('block', 'font:bold')
    document.body.append(p1)
    p1.classList.add('italic')
    await delay(500)
    expect(css.countBy).toEqual({
        'block': 1,
        'font:bold': 1,
        'italic': 1
    })
})

it('css count class complicated example', async () => {
    document.body.innerHTML = complexHTML
    await delay(500)
    document.body.innerHTML = ''
    await delay(500)
    expect(css.countBy).toEqual({})
})