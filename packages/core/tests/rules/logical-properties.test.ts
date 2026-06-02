import { describe, expect, test } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
describe('logical properties', () => {
    test.concurrent('sizing', () => {
        expect(createCSSWithTheme().create('is:16')?.text).toBe('.is\\:16{inline-size:1rem}')
        expect(createCSSWithTheme().create('bs:16')?.text).toBe('.bs\\:16{block-size:1rem}')
        expect(createCSSWithTheme().create('min-is:16')?.text).toBe('.min-is\\:16{min-inline-size:1rem}')
        expect(createCSSWithTheme().create('min-bs:16')?.text).toBe('.min-bs\\:16{min-block-size:1rem}')
        expect(createCSSWithTheme().create('max-is:16')?.text).toBe('.max-is\\:16{max-inline-size:1rem}')
        expect(createCSSWithTheme().create('max-bs:16')?.text).toBe('.max-bs\\:16{max-block-size:1rem}')
    })

    test.concurrent('margin block', () => {
        expect(createCSSWithTheme().create('mbs:16')?.text).toContain('margin-block-start:1rem')
        expect(createCSSWithTheme().create('mbe:16')?.text).toContain('margin-block-end:1rem')
        expect(createCSSWithTheme().create('margin-block:16')?.text).toContain('margin-block:1rem')
    })

    test.concurrent('padding block', () => {
        expect(createCSSWithTheme().create('pbs:16')?.text).toContain('padding-block-start:1rem')
        expect(createCSSWithTheme().create('pbe:16')?.text).toContain('padding-block-end:1rem')
        expect(createCSSWithTheme().create('padding-block:16')?.text).toContain('padding-block:1rem')
    })

    test.concurrent('inset', () => {
        expect(createCSSWithTheme().create('iis:16')?.text).toContain('inset-inline-start:1rem')
        expect(createCSSWithTheme().create('iie:16')?.text).toContain('inset-inline-end:1rem')
        expect(createCSSWithTheme().create('ii:16')?.text).toContain('inset-inline:1rem')
        expect(createCSSWithTheme().create('ibs:16')?.text).toContain('inset-block-start:1rem')
        expect(createCSSWithTheme().create('ibe:16')?.text).toContain('inset-block-end:1rem')
        expect(createCSSWithTheme().create('ib:16')?.text).toContain('inset-block:1rem')
    })

    test.concurrent('related logical properties', () => {
        expect(createCSSWithTheme().create('contain-intrinsic-inline-size:16')?.text).toContain('contain-intrinsic-inline-size:1rem')
        expect(createCSSWithTheme().create('contain-intrinsic-block-size:16')?.text).toContain('contain-intrinsic-block-size:1rem')
        expect(createCSSWithTheme().create('overflow-inline:hidden')?.text).toContain('overflow-inline:hidden')
        expect(createCSSWithTheme().create('overflow-block:auto')?.text).toContain('overflow-block:auto')
        expect(createCSSWithTheme().create('overscroll-behavior-inline:contain')?.text).toContain('overscroll-behavior-inline:contain')
        expect(createCSSWithTheme().create('overscroll-behavior-block:none')?.text).toContain('overscroll-behavior-block:none')
    })
})
