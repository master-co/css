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
                    ':root{--color-primary:#000000}',
                    '.light{--color-primary:oklch(0 0 0)}',
                    '.dark{--color-primary:hsl(0 0% 100%)}'
                ],
                utilities: '.bg\\:primary{background-color:var(--color-primary)}'
            },
            'bg:primary/.5': {
                utilities: '.bg\\:primary\\/\\.5{background-color:color-mix(in oklab,var(--color-primary) 50%,transparent)}'
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
                    ':root{--color-primary:#000000;--color-black:#000000}',
                    '.dark{--color-primary:hsl(0 0% 100%)}',
                    '.light{--color-primary:var(--color-black)}',
                ],
                utilities: '.bg\\:primary{background-color:var(--color-primary)}'
            },
            'bg:primary/.5': {
                utilities: '.bg\\:primary\\/\\.5{background-color:color-mix(in oklab,var(--color-primary) 50%,transparent)}'
            }
        })
})

describe('inline color variable with alpha', () => {
    new CSSTester({ variables: [{ namespace: 'color', key: 'black', value: '#000000' }], utilities, modeTrigger: 'class' }, null)
        .layers({
            'bg:black/.5': {
                theme: ':root{--color-black:#000000}',
                utilities: '.bg\\:black\\/\\.5{background-color:color-mix(in oklab,var(--color-black) 50%,transparent)}'
            }
        })
})

describe('inline color variable with alias and alpha', () => {
    new CSSTester({ variables: [{ namespace: 'color', key: 'black', value: '#000000' }, { namespace: 'color', key: 'primary', value: '$color-black/.5' }], utilities, modeTrigger: 'class' }, null)
        .layers({
            'bg:primary': {
                theme: ':root{--color-primary:color-mix(in oklab,var(--color-black) 50%,transparent);--color-black:#000000}',
                utilities: '.bg\\:primary{background-color:var(--color-primary)}'
            }
        })
})

describe('multiply two alpha', () => {
    new CSSTester({ variables: [{ namespace: 'color', key: 'black', value: '#000000' }, { namespace: 'color', key: 'primary', value: '$color-black/.5' }], utilities, modeTrigger: 'class' }, null)
        .layers({
            'bg:primary/.5': {
                theme: ':root{--color-primary:color-mix(in oklab,var(--color-black) 50%,transparent);--color-black:#000000}',
                utilities: '.bg\\:primary\\/\\.5{background-color:color-mix(in oklab,var(--color-primary) 50%,transparent)}'
            }
        })
})

describe('multiply two alpha', () => {
    new CSSTester({ variables: [{ namespace: 'color', key: 'a', value: '#000000' }, { namespace: 'color', key: 'b', value: '$color-a/.5' }, { namespace: 'color', key: 'c', value: '$color-b/.5' }], utilities, modeTrigger: 'class' }, null)
        .layers({
            'bg:c': {
                theme: ':root{--color-c:color-mix(in oklab,var(--color-b) 50%,transparent);--color-b:color-mix(in oklab,var(--color-a) 50%,transparent);--color-a:#000000}',
                utilities: '.bg\\:c{background-color:var(--color-c)}'
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
                    ':root{--color-alias:var(--color-primary);--color-primary:#000000}',
                    '.light{--color-primary:oklch(0 0 0)}',
                    '.dark{--color-primary:hsl(0 0% 100%)}'
                ],
                utilities: '.bg\\:alias{background-color:var(--color-alias)}'
            }
        })
})
