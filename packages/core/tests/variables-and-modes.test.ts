import { describe } from 'vitest'
import { rules } from '../src'
import CSSTester from './tester'

describe('mix color spaces and modes', () => {
    new CSSTester({
        variables: { primary: '#000000' },
        modes: {
            light: { primary: 'oklch(0 0 0)' },
            dark: { primary: 'hsl(0 0% 100%)' }
        },
        rules,
        modeTrigger: 'class'
    })
        .layers({
            'bg:primary': {
                theme: [
                    ':root{--primary:rgb(0 0 0)}',
                    '.light{--primary:oklch(0 0 0)}',
                    '.dark{--primary:hsl(0 0% 100%)}'
                ],
                general: '.bg\\:primary{background-color:var(--primary)}'
            },
            'bg:primary/.5': {
                general: '.bg\\:primary\\/\\.5{background-color:color-mix(in oklab,var(--primary) 50%,transparent)}'
            }
        })
})

describe('mix color spaces, modes, and alias', () => {
    new CSSTester({
        variables: { black: '#000000', primary: '#000000' },
        modes: {
            dark: { primary: 'hsl(0 0% 100%)' },
            light: { primary: '$black' }
        },
        rules,
        modeTrigger: 'class'
    }, null)
        .layers({
            'bg:primary': {
                theme: [
                    ':root{--primary:rgb(0 0 0)}',
                    '.dark{--primary:hsl(0 0% 100%)}',
                    '.light{--primary:rgb(0 0 0)}',
                ],
                general: '.bg\\:primary{background-color:var(--primary)}'
            },
            'bg:primary/.5': {
                general: '.bg\\:primary\\/\\.5{background-color:color-mix(in oklab,var(--primary) 50%,transparent)}'
            }
        })
})