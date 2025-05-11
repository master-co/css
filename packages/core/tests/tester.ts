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
            this.css = new MasterCSS(config, baseConfig)
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
        theme?: string
        components?: string
        general?: string
        base?: string
        animations?: string
        preset?: string
    }>) {
        test.concurrent.each(Object.entries(cases))('%s', (cls, expected) => {
            const css = this.css.add(...cls.split(' '))
            if (expected.theme)
                expect(css.themeLayer.text).toContain(`@layer theme{${expected.theme}}`)

            if (expected.components)
                expect(css.componentsLayer.text).toContain(`@layer components{${expected.components}}`)

            if (expected.preset)
                expect(css.presetLayer.text).toContain(`@layer preset{${expected.preset}}`)

            if (expected.base)
                expect(css.baseLayer.text).toContain(`@layer base{${expected.base}}`)

            if (expected.general)
                expect(css.generalLayer.text).toContain(`@layer general{${expected.general}}`)

            if (expected.animations)
                expect(css.animationsNonLayer.text).toContain(`${expected.animations}`)
            css.remove(...cls.split(' '))
        })
        return this
    }
}

export const tester = new CSSTester()
export const bareTester = new CSSTester(undefined, null)