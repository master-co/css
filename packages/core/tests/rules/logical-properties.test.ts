import { describe, expect, test } from 'vitest'
import { createCSS } from '../../src'

describe('logical properties', () => {
    test.concurrent('sizing', () => {
        expect(createCSS().create('is:16')?.text).toBe('.is\\:16{inline-size:1rem}')
        expect(createCSS().create('bs:16')?.text).toBe('.bs\\:16{block-size:1rem}')
        expect(createCSS().create('min-is:16')?.text).toBe('.min-is\\:16{min-inline-size:1rem}')
        expect(createCSS().create('min-bs:16')?.text).toBe('.min-bs\\:16{min-block-size:1rem}')
        expect(createCSS().create('max-is:16')?.text).toBe('.max-is\\:16{max-inline-size:1rem}')
        expect(createCSS().create('max-bs:16')?.text).toBe('.max-bs\\:16{max-block-size:1rem}')
    })

    test.concurrent('margin block', () => {
        expect(createCSS().create('mbs:16')?.text).toContain('margin-block-start:1rem')
        expect(createCSS().create('mbe:16')?.text).toContain('margin-block-end:1rem')
        expect(createCSS().create('margin-block:16')?.text).toContain('margin-block:1rem')
    })

    test.concurrent('padding block', () => {
        expect(createCSS().create('pbs:16')?.text).toContain('padding-block-start:1rem')
        expect(createCSS().create('pbe:16')?.text).toContain('padding-block-end:1rem')
        expect(createCSS().create('padding-block:16')?.text).toContain('padding-block:1rem')
    })

    test.concurrent('inset', () => {
        expect(createCSS().create('iis:16')?.text).toContain('inset-inline-start:1rem')
        expect(createCSS().create('iie:16')?.text).toContain('inset-inline-end:1rem')
        expect(createCSS().create('ii:16')?.text).toContain('inset-inline:1rem')
        expect(createCSS().create('ibs:16')?.text).toContain('inset-block-start:1rem')
        expect(createCSS().create('ibe:16')?.text).toContain('inset-block-end:1rem')
        expect(createCSS().create('ib:16')?.text).toContain('inset-block:1rem')
    })

    test.concurrent('related logical properties', () => {
        expect(createCSS().create('contain-intrinsic-inline-size:16')?.text).toContain('contain-intrinsic-inline-size:1rem')
        expect(createCSS().create('contain-intrinsic-block-size:16')?.text).toContain('contain-intrinsic-block-size:1rem')
        expect(createCSS().create('overflow-inline:hidden')?.text).toContain('overflow-inline:hidden')
        expect(createCSS().create('overflow-block:auto')?.text).toContain('overflow-block:auto')
        expect(createCSS().create('overscroll-behavior-inline:contain')?.text).toContain('overscroll-behavior-inline:contain')
        expect(createCSS().create('overscroll-behavior-block:none')?.text).toContain('overscroll-behavior-block:none')
    })
})
