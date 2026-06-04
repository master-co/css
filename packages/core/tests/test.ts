import { test, expect } from 'vitest'
import { Config } from '../src'
import createCSSWithTheme from './helpers/create-css-with-theme'

export const expectLayers = (
    layers: {
        theme?: string
        components?: string
        utilities?: string
        base?: string
        animations?: string
        preset?: string
    },
    className: string | string[],
    config?: Config
) => {
    const css = createCSSWithTheme(config).add(...(Array.isArray(className) ? className : [className]))
    if (layers.theme) expect(css.themeLayer.text).toContain(`@layer theme{${layers.theme ?? ''}}`)
    if (layers.components) expect(css.componentsLayer.text).toContain(`@layer components{${layers.components ?? ''}}`)
    if (layers.preset) expect(css.presetLayer.text).toContain(`@layer preset{${layers.preset ?? ''}}`)
    if (layers.base) expect(css.baseLayer.text).toContain(`@layer base{${layers.base ?? ''}}`)
    if (layers.utilities) expect(css.utilitiesLayer.text).toContain(`@layer utilities{${layers.utilities ?? ''}}`)
    if (layers.animations) expect(css.animationsNonLayer.text).toContain(`${layers.animations ?? ''}`)
}

test('keeps responsive hidden after base display utilities', () => {
    const css = createCSSWithTheme().add('hidden@sm', 'flex')

    expect(css.utilitiesLayer.text).toBe('@layer utilities{.flex{display:flex}@media (width>=52.125rem){.hidden\\@sm{display:none}}}')
})
