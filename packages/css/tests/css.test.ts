import '../src/polyfills/css-escape'
import MasterCSS from '../src'
import delay from '../src/utils/delay'
import { complexHTML } from './complex-html'

/**
 * <p class="block font:bold">
 * <p class="block font:bold italic">
 */
test('css count class add', async () => {
    const p1 = document.createElement('p')
    p1.classList.add('block', 'font:bold')
    document.body.append(p1)
    const css = new MasterCSS()
    p1.classList.add('italic')
    await delay()
    expect(css.countBy).toEqual({
        'block': 1,
        'font:bold': 1,
        'italic': 1
    })
})

test('css count class complicated example', async () => {
    document.body.innerHTML = complexHTML
    const css = new MasterCSS()
    document.body.innerHTML = ''
    await delay()
    expect(css.countBy).toEqual({})
})

test('refresh', async () => {
    const css = new MasterCSS()
    css.refresh({})
})