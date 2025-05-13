import { rules } from '../../src'
import CSSTester from '../tester'

new CSSTester({
    modeTrigger: 'class',
    defaultMode: 'light',
    variables: {
        'white': 'oklch(100% 0 none)',
        'black': 'oklch(0% 0 none)',
    },
    modes: {
        light: {
            'invert': '$black',
        },
        dark: {
            'invert': '$white',
        }
    },
    rules
}, null).layers({
    'bg:invert': {
        theme: [
            '.light,:root{--invert:oklch(0% 0 none)}',
            '.dark{--invert:oklch(100% 0 none)}'
        ],
        general: '.bg\\:invert{background-color:var(--invert)}'
    }
})

// test.concurrent('default mode with host modes', () => {
//     const config = { modeTrigger: 'host' } as Config
//     expect(createCSS(config).add('bg:invert').text).toContain(':host(.light),:host{--invert:0 0 0}')
//     expect(createCSS(config).add('bg:invert').text).toContain(':host(.dark){--invert:255 255 255}')
// })
