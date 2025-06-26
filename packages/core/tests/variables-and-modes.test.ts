import { describe } from 'vitest'
import { rules } from '../src'
import CSSTester from './tester'

describe('mix color spaces and modes', () => {
    new CSSTester({
        variables: { color: { primary: '#000000' } },
        modes: {
            light: { color: { primary: 'oklch(0 0 0)' } },
            dark: { color: { primary: 'hsl(0 0% 100%)' } }
        },
        rules,
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
        variables: { color: { black: '#000000', primary: '#000000' } },
        modes: {
            dark: { color: { primary: 'hsl(0 0% 100%)' } },
            light: { color: { primary: '$color-black' } }
        },
        rules,
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
    new CSSTester({
        variables: { color: { black: '#000000' } },
        rules,
        modeTrigger: 'class'
    }, null)
        .layers({
            'bg:black/.5': {
                general: '.bg\\:black\\/\\.5{background-color:rgb(0 0 0/0.5)}'
            }
        })
})

describe('inline color variable with alias and alpha', () => {
    new CSSTester({
        variables: { color: { black: '#000000', primary: '$color-black/.5' } },
        rules,
        modeTrigger: 'class'
    }, null)
        .layers({
            'bg:primary': {
                general: '.bg\\:primary{background-color:rgb(0 0 0/0.5)}'
            }
        })
})

describe('multiply two alpha', () => {
    new CSSTester({
        variables: { color: { black: '#000000', primary: '$color-black/.5' } },
        rules,
        modeTrigger: 'class'
    }, null)
        .layers({
            'bg:primary/.5': {
                general: '.bg\\:primary\\/\\.5{background-color:rgb(0 0 0/0.25)}'
            }
        })
})

describe('multiply two alpha', () => {
    new CSSTester({
        variables: { color: { a: '#000000', b: '$color-a/.5', c: '$color-b/.5' } },
        rules,
        modeTrigger: 'class'
    }, null)
        .layers({
            'bg:c': {
                general: '.bg\\:c{background-color:rgb(0 0 0/0.25)}'
            }
        })
})

describe('create an alias for a variable with modes', () => {
    new CSSTester({
        variables: { color: { primary: '#000000', alias: '$color-primary' } },
        modes: {
            light: { color: { primary: 'oklch(0 0 0)' } },
            dark: { color: { primary: 'hsl(0 0% 100%)' } }
        },
        rules,
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
