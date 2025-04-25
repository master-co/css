import { expect, test } from 'vitest'
import css from './css'
import { MasterCSS } from '../src'

test.concurrent('mb:48', ({ task }) => {
    css.add(task.name)
    expect(css.generalLayer.rules.length).toBe(1)
    expect(css.generalLayer.text).toBe('@layer general{.mb\\:48{margin-bottom:3rem}}')
    css.remove(task.name)
    expect(css.generalLayer.rules.length).toBe(0)
    expect(css.generalLayer.text).toBe('')
})

test.concurrent('mb:48@preset', ({ task }) => {
    css.add(task.name)
    expect(css.presetLayer.rules.length).toBe(1)
    expect(css.presetLayer.text).toBe('@layer preset{.mb\\:48\\@preset{margin-bottom:3rem}}')
    css.remove(task.name)
    expect(css.presetLayer.rules.length).toBe(0)
    expect(css.presetLayer.text).toBe('')
})

test.concurrent('btn@sm', ({ task }) => {
    const css = new MasterCSS({
        components: {
            btn: 'block font:32'
        }
    })
    css.add(task.name)
    expect(css.componentsLayer.rules.length).toBe(2)
    expect(css.componentsLayer.text).toBe('@layer components{@media (width>=52.125rem){.btn\\@sm{display:block}}@media (width>=52.125rem){.btn\\@sm{font-size:2rem}}}')
    css.remove(task.name)
    expect(css.componentsLayer.rules.length).toBe(0)
    expect(css.componentsLayer.text).toBe('')
})