import { expect, test } from 'vitest'
import { Config, sortReadableClasses, MasterCSS, config as defaultConfig } from '../src'

export default class CSSTester {
    public css: MasterCSS

    constructor(
        public config?: Config,
        public baseConfig: Config | null = defaultConfig,
    ) {
        if (baseConfig === null) {
            this.css = new MasterCSS(config)
        } else {
            this.css = new MasterCSS(config, baseConfig || defaultConfig)
        }
    }

    classText(cases: Record<string, string>) {
        test.concurrent.each(Object.entries(cases))('%s', (cls, expectedText) => {
            expect(this.css.create(cls)?.text).toBe(expectedText)
        })
        return this
    }

    priority(layerName: keyof Pick<MasterCSS, 'baseLayer' | 'presetLayer' | 'componentsLayer' | 'generalLayer'>, cases: Record<string, string[] | [string, string[]]>) {
        test.concurrent.each(Object.entries(cases))('%s', (_, [cls, expected]) => {
            if (Array.isArray(cls)) {
                this.css.add(...(cls as string[]))
                expect(this.css[layerName].rules.map(({ name }) => name)).toEqual(expected)
                this.css.remove(...(cls as string[]))
            } else {
                this.css.add(cls)
                expect(this.css[layerName].rules.map(({ name }) => name)).toEqual(expected)
                this.css.remove(cls)
            }
        })
        return this
    }

    readableClasses(cases: Record<string, string>) {
        test.concurrent.each(Object.entries(cases))('%s', (_, cls) => {
            const classList = cls.split(' ')
                .flat()
                .map((c) => c.trim())
                .filter(Boolean)
            const result = sortReadableClasses([...classList], this.css).join(' ')
            expect(result).toBe(classList.join(' '))
        })
        return this
    }

    layers(cases: Record<string, {
        theme?: string | string[]
        components?: string | string[]
        general?: string | string[]
        base?: string | string[]
        animations?: string | string[]
        preset?: string | string[]
    }>) {
        test.concurrent.each(Object.entries(cases))('%s', (cls, { theme, components, preset, base, general, animations }) => {
            const css = this.css.add(...cls.split(' '))
            theme = Array.isArray(theme) ? theme.join('') : theme
            components = Array.isArray(components) ? components.join('') : components
            preset = Array.isArray(preset) ? preset.join('') : preset
            base = Array.isArray(base) ? base.join('') : base
            general = Array.isArray(general) ? general.join('') : general
            animations = Array.isArray(animations) ? animations.join('') : animations
            if (theme) expect(css.themeLayer.text).toBe(`@layer theme{${theme}}`)
            if (components) expect(css.componentsLayer.text).toBe(`@layer components{${components}}`)
            if (preset) expect(css.presetLayer.text).toBe(`@layer preset{${preset}}`)
            if (base) expect(css.baseLayer.text).toBe(`@layer base{${base}}`)
            if (general) expect(css.generalLayer.text).toBe(`@layer general{${general}}`)
            if (animations) expect(css.animationsNonLayer.text).toBe(`${animations}`)
            css.remove(...cls.split(' '))
        })
        return this
    }
}