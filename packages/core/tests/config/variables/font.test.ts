import { it, test, expect } from 'vitest'
import { createCSS } from '../../../src'

it.concurrent('should be able to access related font variables using inherited rules', () => {
    expect(Array.from(createCSS().definedRules.find(({ id }) => id === 'font')?.variables?.keys() || [])).toEqual([
        'mono',
        'sans',
        'serif',
        'thin',
        '-thin',
        'extralight',
        '-extralight',
        'light',
        '-light',
        'regular',
        '-regular',
        'medium',
        '-medium',
        'semibold',
        '-semibold',
        'bold',
        '-bold',
        'extrabold',
        '-extrabold',
        'heavy',
        '-heavy',
    ])
})