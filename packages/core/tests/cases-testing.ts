import { expect, test } from 'vitest'
import css from './css'
import shuffleArray from 'shuffle-array'
import { Config, sortReadableClasses } from '../src'

const Testing = {
    classText(cases: Record<string, string>) {
        test.concurrent.each(Object.entries(cases))('%s', (cls, text) => {
            expect(css.create(cls)?.text).toBe(text)
        })
    },
    priority(cases: Record<string, string[] | [string, string[], Config?]>) {
        test.concurrent.each(Object.entries(cases))('%s', (_, args) => {
            if (Array.isArray(args[1])) {
                const [cls, expected, config] = args as [string, string[], Config]
                const css = new MasterCSS(config)
                css.add(cls)
                expect(css.componentsLayer.rules.map(({ name }) => name)).toEqual(expected)
            } else {
                const css = new MasterCSS()
                css.add(...shuffleArray([...(args as string[])]))
                expect(css.generalLayer.rules.map(({ name }) => name)).toEqual(args)
            }
        })
    },
    readableClasses(cases: Record<string, string[]>, config?: Config) {
        test.concurrent.each(Object.entries(cases))('%s', (_, classes) => {
            expect(sortReadableClasses(shuffleArray([...classes]), new MasterCSS(config))).toEqual(classes)
        })
    },
    layers(cases: Record<string, {
        theme?: string
        components?: string
        general?: string
        base?: string
        animations?: string
        preset?: string
    }>, config?: Config) {
        test.concurrent.each(Object.entries(cases))('%s', (cls: string, expected) => {
            const css = new MasterCSS(config).add(...cls.split(' '))
            if (expected.theme) expect(css.themeLayer.text).toContain(`@layer theme{${expected.theme ?? ''}}`)
            if (expected.components) expect(css.componentsLayer.text).toContain(`@layer components{${expected.components ?? ''}}`)
            if (expected.preset) expect(css.presetLayer.text).toContain(`@layer preset{${expected.preset ?? ''}}`)
            if (expected.base) expect(css.baseLayer.text).toContain(`@layer base{${expected.base ?? ''}}`)
            if (expected.general) expect(css.generalLayer.text).toContain(`@layer general{${expected.general ?? ''}}`)
            if (expected.animations) expect(css.animationsNonLayer.text).toContain(`${expected.animations ?? ''}`)
        })

    }
}

export default Testing