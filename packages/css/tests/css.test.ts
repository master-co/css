import '../src/polyfills/css-escape'
import { initRuntime } from '../src'
import delay from 'shared/utils/delay'
import { complexHTML } from './complex-html'

const css = initRuntime()
/**
 * <p class="block font:bold">
 * <p class="block font:bold italic">
 */
it('css count class add', async () => {
    const p1 = document.createElement('p')
    p1.classList.add('block', 'font:bold')
    document.body.append(p1)
    p1.classList.add('italic')
    await delay()
    expect(css.countBy).toEqual({
        'block': 1,
        'font:bold': 1,
        'italic': 1
    })
})

it('css count class complicated example', async () => {
    document.body.innerHTML = complexHTML
    await delay()
    document.body.innerHTML = ''
    await delay()
    expect(css.countBy).toEqual({})
})