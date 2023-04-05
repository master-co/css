import { expectOrderOfRules, testProp } from './css'

it('checks scroll-padding order', () => {
    expectOrderOfRules(
        ['spx:0', 'spl:0', 'spr:0', 'sp:0', 'spt:0', 'spb:0', 'spy:0'],
        ['sp:0', 'spy:0', 'spx:0', 'spb:0', 'spt:0', 'spr:0', 'spl:0']
    )
})

it('validates scroll-padding rules', () => {
    testProp('spl:16', 'scroll-padding-left:1rem')
    testProp('spr:16', 'scroll-padding-right:1rem')
    testProp('spt:16', 'scroll-padding-top:1rem')
    testProp('spb:16', 'scroll-padding-bottom:1rem')
    testProp('sp:16', 'scroll-padding:1rem')
    testProp('spx:16', 'scroll-padding-left:1rem;scroll-padding-right:1rem')
    testProp('spy:16', 'scroll-padding-top:1rem;scroll-padding-bottom:1rem')
})