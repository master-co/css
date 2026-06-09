import { expect, test } from 'vitest'
import { createCSS } from '../../../src'

test.concurrent('inlines color variables without emitting theme rules', () => {
    const css = createCSS({
        variables: [{ namespace: 'color', key: 'primary', value: '#123', inline: true }]
    }).add('bg:primary')

    expect(css.utilitiesLayer.text).toBe('@layer utilities{.bg\\:primary{background-color:#123}}')
    expect(css.themeLayer.text).toBe('')
})

test.concurrent('inlines numeric variables using the utility unit', () => {
    const css = createCSS({
        variables: [{ namespace: 'spacing', key: 'card', value: 16, inline: true }]
    }).add('m:card')

    expect(css.utilitiesLayer.text).toBe('@layer utilities{.m\\:card{margin:1rem}}')
    expect(css.themeLayer.text).toBe('')
})

test.concurrent('inlines alpha colors', () => {
    const css = createCSS({
        variables: [{ namespace: 'color', key: 'brand', value: '#123456', inline: true }]
    }).add('fg:brand/.5')

    expect(css.utilitiesLayer.text).toBe('@layer utilities{.fg\\:brand\\/\\.5{color:color-mix(in oklab,#123456 50%,transparent)}}')
    expect(css.themeLayer.text).toBe('')
})

test.concurrent('inlines generated negative numeric variables', () => {
    const css = createCSS({
        variables: [{ namespace: 'width', key: '11x', value: 60, inline: true }]
    }).add('w:-11x')

    expect(css.utilitiesLayer.text).toBe('@layer utilities{.w\\:-11x{width:-3.75rem}}')
    expect(css.themeLayer.text).toBe('')
})

test.concurrent('recursively inlines inline aliases', () => {
    const css = createCSS({
        variables: [
            { namespace: 'color', key: 'primary', value: '#123', inline: true },
            { namespace: 'color', key: 'brand', value: '$color-primary', inline: true }
        ]
    }).add('fg:brand')

    expect(css.utilitiesLayer.text).toBe('@layer utilities{.fg\\:brand{color:#123}}')
    expect(css.themeLayer.text).toBe('')
})

test.concurrent('keeps regular aliases referenced by inline variables', () => {
    const css = createCSS({
        variables: [
            { namespace: 'color', key: 'primary', value: '#123' },
            { namespace: 'color', key: 'brand', value: '$color-primary', inline: true }
        ]
    }).add('fg:brand')

    expect(css.utilitiesLayer.text).toBe('@layer utilities{.fg\\:brand{color:var(--color-primary)}}')
    expect(css.themeLayer.text).toBe('@layer theme{:root{--color-primary:#123}}')
})

test.concurrent('expands inline references inside regular theme variables', () => {
    const css = createCSS({
        variables: [
            { namespace: 'color', key: 'primary', value: '#123', inline: true },
            { namespace: 'color', key: 'brand', value: '$color-primary' }
        ]
    }).add('fg:brand')

    expect(css.utilitiesLayer.text).toBe('@layer utilities{.fg\\:brand{color:var(--color-brand)}}')
    expect(css.themeLayer.text).toBe('@layer theme{:root{--color-brand:#123}}')
})

test.concurrent('rejects mode-specific inline variables', () => {
    expect(() => createCSS({
        variables: [{ key: 'brand', value: '#123', mode: 'dark', inline: true }]
    })).toThrow('Inline theme variables cannot be mode-specific: brand@dark')
})

test.concurrent('rejects inline variables with separate mode definitions', () => {
    expect(() => createCSS({
        variables: [
            { namespace: 'color', key: 'brand', value: '#123', inline: true },
            { namespace: 'color', key: 'brand', value: '#fff', mode: 'dark' }
        ]
    })).toThrow('Inline theme variables cannot be mode-specific: color-brand@dark')
})

test.concurrent('rejects circular inline aliases', () => {
    expect(() => createCSS({
        variables: [
            { namespace: 'color', key: 'a', value: '$color-b', inline: true },
            { namespace: 'color', key: 'b', value: '$color-a', inline: true }
        ]
    }).add('fg:a')).toThrow('Circular inline variable reference: color-a -> color-b -> color-a')
})
