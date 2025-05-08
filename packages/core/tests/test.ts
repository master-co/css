import { test, expect } from 'vitest'
import { Config, createCSS } from '../src'

export const expectLayers = (
    layers: {
        theme?: string
        components?: string
        general?: string
        base?: string
        animations?: string
        preset?: string
    },
    className: string | string[],
    customConfig?: Config
) => {
    const css = createCSS(customConfig).add(...(Array.isArray(className) ? className : [className]))
    if (layers.theme) expect(css.themeLayer.text).toContain(`@layer theme{${layers.theme ?? ''}}`)
    if (layers.components) expect(css.componentsLayer.text).toContain(`@layer components{${layers.components ?? ''}}`)
    if (layers.preset) expect(css.presetLayer.text).toContain(`@layer preset{${layers.preset ?? ''}}`)
    if (layers.base) expect(css.baseLayer.text).toContain(`@layer base{${layers.base ?? ''}}`)
    if (layers.general) expect(css.generalLayer.text).toContain(`@layer general{${layers.general ?? ''}}`)
    if (layers.animations) expect(css.animationsNonLayer.text).toContain(`${layers.animations ?? ''}`)
}

test.todo('hidden@sm and flex ordering')