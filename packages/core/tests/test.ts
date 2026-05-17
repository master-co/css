import { test, expect } from 'vitest'
import { Config, createCSS } from '../src'

export const expectLayers = (
    layers: {
        theme?: string
        main?: string
        components?: string
        general?: string
        utilities?: string
        base?: string
        animations?: string
        preset?: string
    },
    className: string | string[],
    customConfig?: Config
) => {
    const css = createCSS(customConfig).add(...(Array.isArray(className) ? className : [className]))
    if (layers.theme) expect(css.themeLayer.text).toContain(`@layer theme{${layers.theme ?? ''}}`)
    if (layers.main || layers.components) expect(css.mainLayer.text).toContain(`@layer main{${layers.main ?? layers.components ?? ''}}`)
    if (layers.preset) expect(css.presetLayer.text).toContain(`@layer preset{${layers.preset ?? ''}}`)
    if (layers.base) expect(css.baseLayer.text).toContain(`@layer base{${layers.base ?? ''}}`)
    if (layers.general || layers.utilities) expect(css.generalLayer.text).toContain(`@layer general{${layers.general ?? layers.utilities ?? ''}}`)
    if (layers.animations) expect(css.animationsNonLayer.text).toContain(`${layers.animations ?? ''}`)
}

test('keeps responsive hidden after base display utilities', () => {
    const css = createCSS().add('hidden@sm', 'flex')

    expect(css.generalLayer.text).toBe('@layer general{.flex{display:flex}@media (width>=52.125rem){.hidden\\@sm{display:none}}}')
})
