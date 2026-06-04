import { expect, test } from 'vitest'
import css from './css'
import { UtilityType } from '../src'
import createCSSWithTheme from './helpers/create-css-with-theme'
test.concurrent('mb:48', ({ task }) => {
    css.add(task.name)
    expect(css.utilitiesLayer.rules.length).toBe(1)
    expect(css.utilitiesLayer.text).toBe('@layer utilities{.mb\\:48{margin-bottom:3rem}}')
    css.remove(task.name)
    expect(css.utilitiesLayer.rules.length).toBe(0)
    expect(css.utilitiesLayer.text).toBe('')
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
    const css = createCSSWithTheme({
        utilities: [
            {
                name: 'btn',
                type: UtilityType.Static,
                layer: 'components',
                rules: [
                    { selector: '&', declarations: { display: 'block' } },
                    { selector: '&', declarations: { 'font-size': '2rem' } }
                ]
            }
        ]
    })
    css.add(task.name)
    expect(css.componentsLayer.rules.length).toBe(1)
    expect(css.componentsLayer.text).toBe('@layer components{@media (width>=52.125rem){.btn\\@sm{display:block}}@media (width>=52.125rem){.btn\\@sm{font-size:2rem}}}')
    css.remove(task.name)
    expect(css.componentsLayer.rules.length).toBe(0)
    expect(css.componentsLayer.text).toBe('')
})
