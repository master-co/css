import { describe, it, expect, test } from 'vitest'
import { MasterCSS } from '../src'

describe('add and remove', () => {
    const css = new MasterCSS()
    test('add mb:48', async () => {
        css.add('mb:48')
        expect(css.generalLayer.rules.length).toBe(1)
        expect(css.generalLayer.text).toBe('@layer general{.mb\\:48{margin-bottom:3rem}}')
    })
    test('remove mb:48', async () => {
        css.remove('mb:48')
        expect(css.generalLayer.rules.length).toBe(0)
        expect(css.generalLayer.text).toBe('')
    })
})

describe('add and remove preset/base', () => {
    const css = new MasterCSS()
    test('add mb:48@preset', async () => {
        css.add('mb:48@preset')
        expect(css.presetLayer.rules.length).toBe(1)
        expect(css.presetLayer.text).toBe('@layer preset{.mb\\:48\\@preset{margin-bottom:3rem}}')
    })
    test('remove mb:48@preset', async () => {
        css.remove('mb:48@preset')
        expect(css.presetLayer.rules.length).toBe(0)
        expect(css.presetLayer.text).toBe('')
    })
})