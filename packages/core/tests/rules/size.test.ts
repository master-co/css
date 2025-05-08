import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('size', () => {
    expect(createCSS().create('size:4x')?.declarations).toStrictEqual({ width: '1rem', height: '1rem' })
    expect(createCSS().create('size:16|32')?.declarations).toStrictEqual({ width: '1rem', height: '2rem' })
    expect(createCSS().create('size:$(w)|$(h)')?.declarations).toStrictEqual({ width: 'var(--w)', height: 'var(--h)' })
    expect(createCSS().create('size:screen-md')?.declarations).toStrictEqual({ width: '64rem', height: '64rem' })
    expect(createCSS({ variables: { w: 16, h: 16 } }).create('size:$(w)|$(h)')?.declarations).toStrictEqual({ width: '1rem', height: '1rem' })

    expect(createCSS().create('size:16|calc(min(30,50)-25)')?.declarations).toStrictEqual({ width: '1rem', height: 'calc(min(30, 50) / 16 * 1rem - 1.5625rem)' })
    expect(createCSS().create('size:min(10,calc(25-10))|10')?.declarations).toStrictEqual({ width: 'min(0.625rem,calc(1.5625rem - 0.625rem))', height: '0.625rem' })
    expect(createCSS().create('size:min(10,calc(25-10))|calc(min(30,50)-25)')?.declarations).toStrictEqual({ width: 'min(0.625rem,calc(1.5625rem - 0.625rem))', height: 'calc(min(30, 50) / 16 * 1rem - 1.5625rem)' })
})

test.concurrent('max size', () => {
    expect(createCSS().create('max:4x')?.declarations).toStrictEqual({ 'max-width': '1rem', 'max-height': '1rem' })
    expect(createCSS().create('max:16|32')?.declarations).toStrictEqual({ 'max-width': '1rem', 'max-height': '2rem' })
    expect(createCSS().create('max:$(w)|$(h)')?.declarations).toStrictEqual({ 'max-width': 'var(--w)', 'max-height': 'var(--h)' })
    expect(createCSS({ variables: { w: 16, h: 16 } }).create('max:$(w)|$(h)')?.declarations).toStrictEqual({ 'max-width': '1rem', 'max-height': '1rem' })
})

test.concurrent('min size', () => {
    expect(createCSS().create('min:4x')?.declarations).toStrictEqual({ 'min-width': '1rem', 'min-height': '1rem' })
    expect(createCSS().create('min:16|32')?.declarations).toStrictEqual({ 'min-width': '1rem', 'min-height': '2rem' })
    expect(createCSS().create('min:$(w)|$(h)')?.declarations).toStrictEqual({ 'min-width': 'var(--w)', 'min-height': 'var(--h)' })
    expect(createCSS({ variables: { w: 16, h: 16 } }).create('min:$(w)|$(h)')?.declarations).toStrictEqual({ 'min-width': '1rem', 'min-height': '1rem' })
})

