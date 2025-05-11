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
        test.concurrent.each(Object.entries(cases))('%s', (_, args) => {
            if (!Array.isArray(args[1])) {
                const [cls, ...expected] = args
                this.css.add(cls)
                expect(this.css[layerName].rules.map(({ name }) => name)).toEqual(expected)
                this.css.remove(cls)
            } else {
                const [cls, expected] = args
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
            const classes = cls.split(' ')
            const css = this.css.add(...classes)
            theme = Array.isArray(theme) ? theme.join('') : theme
            components = Array.isArray(components) ? components.join('') : components
            preset = Array.isArray(preset) ? preset.join('') : preset
            base = Array.isArray(base) ? base.join('') : base
            general = Array.isArray(general) ? general.join('') : general
            animations = Array.isArray(animations) ? animations.join('') : animations
            if (theme) expect(css.themeLayer.rules.map(rules => rules.text).join('')).toContain(theme)
            if (components) expect(css.componentsLayer.rules.map(rules => rules.text).join('')).toContain(components)
            if (preset) expect(css.presetLayer.rules.map(rules => rules.text).join('')).toContain(preset)
            if (base) expect(css.baseLayer.rules.map(rules => rules.text).join('')).toContain(base)
            if (general) expect(css.generalLayer.rules.map(rules => rules.text).join('')).toContain(general)
            if (animations) expect(css.animationsNonLayer.rules.map(rules => rules.text).join('')).toContain(animations)
            css.remove(...classes)
        })
        return this
    }
}