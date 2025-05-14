import { it, expect } from 'vitest'
import { flattenMetaObject, nestMetaObject } from '../../src'

it('flattens and nests a single-level object', () => {
    const input = { color: { primary: '#000' } }
    const flat = flattenMetaObject(input)

    expect(flat).toEqual({
        'color-primary': {
            key: 'primary',
            name: 'color-primary',
            value: '#000',
            group: 'color',
            namespace: 'color'
        }
    })

    const nested = nestMetaObject(flat)
    expect(nested).toEqual(input)
})

it('flattens and nests a deeply nested object', () => {
    const input = {
        theme: {
            color: {
                primary: '#000',
                secondary: '#666'
            }
        }
    }
    const flat = flattenMetaObject(input)

    expect(flat).toMatchObject({
        'theme-color-primary': {
            key: 'primary',
            name: 'theme-color-primary',
            value: '#000',
            group: 'theme.color',
            namespace: 'theme'
        },
        'theme-color-secondary': {
            key: 'secondary',
            name: 'theme-color-secondary',
            value: '#666',
            group: 'theme.color',
            namespace: 'theme'
        }
    })

    const nested = nestMetaObject(flat)
    expect(nested).toEqual(input)
})

it('flattens { "": value } special form', () => {
    const input = {
        color: {
            primary: {
                '': '#333'
            }
        }
    }
    const flat = flattenMetaObject(input)

    expect(flat).toEqual({
        'color-primary': {
            key: 'primary',
            name: 'color-primary',
            value: '#333',
            group: 'color',
            namespace: 'color'
        }
    })

    const nested = nestMetaObject(flat)
    expect(nested).toEqual({
        color: {
            primary: '#333'
        }
    })
})

it('handles top-level key only (no group)', () => {
    const input = { primary: '#111' }
    const flat = flattenMetaObject(input)

    expect(flat).toEqual({
        primary: {
            key: 'primary',
            name: 'primary',
            value: '#111'
        }
    })

    const nested = nestMetaObject(flat)
    expect(nested).toEqual(input)
})

it('handles array values by joining them with comma', () => {
    const input = {
        font: {
            stack: ['Helvetica', 'Arial', 'sans-serif']
        }
    }
    const flat = flattenMetaObject(input)

    expect(flat).toEqual({
        'font-stack': {
            key: 'stack',
            name: 'font-stack',
            value: 'Helvetica,Arial,sans-serif',
            group: 'font',
            namespace: 'font'
        }
    })

    const nested = nestMetaObject(flat)
    expect(nested).toEqual({
        font: {
            stack: 'Helvetica,Arial,sans-serif'
        }
    })
})

it('wraps conflicting primitive value into { "": value } when same group used', () => {
    const flat = {
        'stone': {
            name: 'stone',
            key: 'stone',
            value: '$stone-30',
        },
        'stone-active': {
            name: 'stone-active',
            key: 'active',
            group: 'stone',
            value: '$stone-40',
            namespace: 'stone'
        }
    }

    const result = nestMetaObject(flat)

    expect(result).toEqual({
        stone: {
            '': '$stone-30',
            active: '$stone-40'
        }
    })

    expect(flattenMetaObject(result)).toEqual(flat)
})

it('handles deeply nested group correctly', () => {
    const flat = {
        'text-strong': {
            name: 'text-strong',
            key: 'strong',
            group: 'color.text',
            value: '$grey-100'
        }
    }

    const result = nestMetaObject(flat)

    expect(result).toEqual({
        color: {
            text: {
                strong: '$grey-100'
            }
        }
    })
})

it('handles no group (flat key) values', () => {
    const flat = {
        'white': {
            name: 'white',
            key: 'white',
            value: 'oklch(100% 0 none)'
        }
    }

    const result = nestMetaObject(flat)

    expect(result).toEqual({
        white: 'oklch(100% 0 none)'
    })
})