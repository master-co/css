import { describe } from 'vitest'
import { utilities } from '../src'
import CSSTester from './tester'

describe('mix color spaces and modes', () => {
    new CSSTester({
        variables: [
            { namespace: 'color', key: 'primary', value: '#000000' },
            { namespace: 'color', key: 'primary', value: 'oklch(0 0 0)', mode: 'light' },
            { namespace: 'color', key: 'primary', value: 'hsl(0 0% 100%)', mode: 'dark' }
        ],
        modes: ['light', 'dark'],
        utilities,
        modeTrigger: 'class'
    }, null)
        .layers({
            'bg:primary': {
                theme: [
                    ':root{--color-primary:rgb(0 0 0)}',
                    '.light{--color-primary:oklch(0 0 0)}',
                    '.dark{--color-primary:hsl(0 0% 100%)}'
                ],
                general: '.bg\\:primary{background-color:var(--color-primary)}'
            },
            'bg:primary/.5': {
                general: '.bg\\:primary\\/\\.5{background-color:color-mix(in oklab,var(--color-primary) 50%,transparent)}'
            }
        })
})

describe('mix color spaces, modes, and alias', () => {
    new CSSTester({
        variables: [
            { namespace: 'color', key: 'black', value: '#000000' },
            { namespace: 'color', key: 'primary', value: '#000000' },
            { namespace: 'color', key: 'primary', value: 'hsl(0 0% 100%)', mode: 'dark' },
            { namespace: 'color', key: 'primary', value: '$color-black', mode: 'light' }
        ],
        modes: ['dark', 'light'],
        utilities,
        modeTrigger: 'class'
    }, null)
        .layers({
            'bg:primary': {
                theme: [
                    ':root{--color-primary:rgb(0 0 0)}',
                    '.dark{--color-primary:hsl(0 0% 100%)}',
                    '.light{--color-primary:rgb(0 0 0)}',
                ],
                general: '.bg\\:primary{background-color:var(--color-primary)}'
            },
            'bg:primary/.5': {
                general: '.bg\\:primary\\/\\.5{background-color:color-mix(in oklab,var(--color-primary) 50%,transparent)}'
            }
        })
})

describe('inline color variable with alpha', () => {
    new CSSTester({ variables: [{ namespace: 'color', key: 'black', value: '#000000' }], utilities, modeTrigger: 'class' }, null)
        .layers({
            'bg:black/.5': {
                general: '.bg\\:black\\/\\.5{background-color:rgb(0 0 0/0.5)}'
            }
        })
})

describe('inline color variable with alias and alpha', () => {
    new CSSTester({ variables: [{ namespace: 'color', key: 'black', value: '#000000' }, { namespace: 'color', key: 'primary', value: '$color-black/.5' }], utilities, modeTrigger: 'class' }, null)
        .layers({
            'bg:primary': {
                general: '.bg\\:primary{background-color:rgb(0 0 0/0.5)}'
            }
        })
})

describe('multiply two alpha', () => {
    new CSSTester({ variables: [{ namespace: 'color', key: 'black', value: '#000000' }, { namespace: 'color', key: 'primary', value: '$color-black/.5' }], utilities, modeTrigger: 'class' }, null)
        .layers({
            'bg:primary/.5': {
                general: '.bg\\:primary\\/\\.5{background-color:rgb(0 0 0/0.25)}'
            }
        })
})

describe('multiply two alpha', () => {
    new CSSTester({ variables: [{ namespace: 'color', key: 'a', value: '#000000' }, { namespace: 'color', key: 'b', value: '$color-a/.5' }, { namespace: 'color', key: 'c', value: '$color-b/.5' }], utilities, modeTrigger: 'class' }, null)
        .layers({
            'bg:c': {
                general: '.bg\\:c{background-color:rgb(0 0 0/0.25)}'
            }
        })
})

describe('create an alias for a variable with modes', () => {
    new CSSTester({
        variables: [
            { namespace: 'color', key: 'primary', value: '#000000' },
            { namespace: 'color', key: 'alias', value: '$color-primary' },
            { namespace: 'color', key: 'primary', value: 'oklch(0 0 0)', mode: 'light' },
            { namespace: 'color', key: 'primary', value: 'hsl(0 0% 100%)', mode: 'dark' }
        ],
        modes: ['light', 'dark'],
        utilities,
        modeTrigger: 'class'
    }, null)
        .layers({
            'bg:alias': {
                theme: [
                    ':root{--color-alias:rgb(0 0 0)}',
                    '.light{--color-alias:oklch(0 0 0)}',
                    '.dark{--color-alias:hsl(0 0% 100%)}'
                ],
                general: '.bg\\:alias{background-color:var(--color-alias)}'
            }
        })
})
