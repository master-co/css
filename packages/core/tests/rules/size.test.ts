import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('size', () => {
    expect(createCSSWithTheme().create('size:4x')?.declarations).toStrictEqual({ width: '1rem', height: '1rem' })
    expect(createCSSWithTheme().create('size:16|32')?.declarations).toStrictEqual({ width: '1rem', height: '2rem' })
    expect(createCSSWithTheme().create('size:$(w)|$(h)')?.declarations).toStrictEqual({ width: 'var(--w)', height: 'var(--h)' })
    expect(createCSSWithTheme().create('size:container-md')?.declarations).toStrictEqual({ width: 'calc(var(--container-md) / 16 * 1rem)', height: 'calc(var(--container-md) / 16 * 1rem)' })
    expect(createCSSWithTheme({ variables: [{ key: 'w', value: 16 }, { key: 'h', value: 16 }] }).create('size:$(w)|$(h)')?.declarations).toStrictEqual({ width: 'calc(var(--w) / 16 * 1rem)', height: 'calc(var(--h) / 16 * 1rem)' })

    expect(createCSSWithTheme().create('size:16|calc(min(30,50)-25)')?.declarations).toStrictEqual({ width: '1rem', height: 'calc(min(30, 50) / 16 * 1rem - 1.5625rem)' })
    expect(createCSSWithTheme().create('size:min(10,calc(25-10))|10')?.declarations).toStrictEqual({ width: 'min(0.625rem,calc(1.5625rem - 0.625rem))', height: '0.625rem' })
    expect(createCSSWithTheme().create('size:min(10,calc(25-10))|calc(min(30,50)-25)')?.declarations).toStrictEqual({ width: 'min(0.625rem,calc(1.5625rem - 0.625rem))', height: 'calc(min(30, 50) / 16 * 1rem - 1.5625rem)' })
})

test.concurrent('max size', () => {
    expect(createCSSWithTheme().create('max:4x')?.declarations).toStrictEqual({ 'max-width': '1rem', 'max-height': '1rem' })
    expect(createCSSWithTheme().create('max:16|32')?.declarations).toStrictEqual({ 'max-width': '1rem', 'max-height': '2rem' })
    expect(createCSSWithTheme().create('max:$(w)|$(h)')?.declarations).toStrictEqual({ 'max-width': 'var(--w)', 'max-height': 'var(--h)' })
    expect(createCSSWithTheme({ variables: [{ key: 'w', value: 16 }, { key: 'h', value: 16 }] }).create('max:$(w)|$(h)')?.declarations).toStrictEqual({ 'max-width': 'calc(var(--w) / 16 * 1rem)', 'max-height': 'calc(var(--h) / 16 * 1rem)' })
})

test.concurrent('min size', () => {
    expect(createCSSWithTheme().create('min:4x')?.declarations).toStrictEqual({ 'min-width': '1rem', 'min-height': '1rem' })
    expect(createCSSWithTheme().create('min:16|32')?.declarations).toStrictEqual({ 'min-width': '1rem', 'min-height': '2rem' })
    expect(createCSSWithTheme().create('min:$(w)|$(h)')?.declarations).toStrictEqual({ 'min-width': 'var(--w)', 'min-height': 'var(--h)' })
    expect(createCSSWithTheme({ variables: [{ key: 'w', value: 16 }, { key: 'h', value: 16 }] }).create('min:$(w)|$(h)')?.declarations).toStrictEqual({ 'min-width': 'calc(var(--w) / 16 * 1rem)', 'min-height': 'calc(var(--h) / 16 * 1rem)' })
})
