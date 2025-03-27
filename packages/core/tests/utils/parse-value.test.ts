import { test, expect } from 'vitest'
import { parseValue } from '../../src'

test.concurrent('.5', () => {
    expect(parseValue('.5')).toEqual({ token: '.5', type: 'number', value: 0.5, unit: '' })
})

test.concurrent('0.5', () => {
    expect(parseValue('.5')).toEqual({ token: '.5', type: 'number', value: 0.5, unit: '' })
})

test.concurrent('text', () => {
    expect(parseValue('text')).toEqual({ token: 'text', type: 'string', value: 'text'})
})
