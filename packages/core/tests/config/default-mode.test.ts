import { utilities } from '../../src'
import CSSTester from '../tester'

new CSSTester({ modeTrigger: 'class', defaultMode: 'light', variables: [{ namespace: 'color', key: 'white', value: 'oklch(100% 0 none)' }, { namespace: 'color', key: 'black', value: 'oklch(0% 0 none)' }, { namespace: 'color', key: 'invert', value: '$color-black', mode: 'light' }, { namespace: 'color', key: 'invert', value: '$color-white', mode: 'dark' }], modes: ['light', 'dark'], utilities }, null).layers({
    'bg:invert': {
        theme: [
            '.light,:root{--color-invert:var(--color-black)}',
            '.dark{--color-invert:var(--color-white)}'
        ],
        utilities: '.bg\\:invert{background-color:var(--color-invert)}'
    }
})

// test.concurrent('default mode with host modes', () => {
//     const config = { modeTrigger: 'host' } as Config
//     expect(createCSS(config).add('bg:invert').text).toContain(':host(.light),:host{--invert:0 0 0}')
//     expect(createCSS(config).add('bg:invert').text).toContain(':host(.dark){--invert:255 255 255}')
// })
