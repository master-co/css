import { initRuntime } from '../src'
import { complexHTML } from './complex-html'

beforeAll(() => {
    initRuntime()
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
    await new Promise(resolve => setTimeout(resolve))
    expect(window.masterCSS.classesUsage).toEqual({
        'block': 1,
        'font:bold': 1,
        'italic': 1
    })
})

it('css count class complicated example', async () => {
    document.body.innerHTML = complexHTML
    await new Promise(resolve => setTimeout(resolve))
    expect(Object.keys(window.masterCSS.classesUsage).length).toBeTruthy()
    document.body.innerHTML = ''
    await new Promise(resolve => setTimeout(resolve))
    expect(window.masterCSS.classesUsage).toEqual({})
})