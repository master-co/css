import { expectOrderOfRules, testProp } from './css'

it('checks scroll-margin order', () => {
    expectOrderOfRules(
        ['smx:0', 'sml:0', 'smr:0', 'sm:0', 'smt:0', 'smb:0', 'smy:0'],
        ['sm:0', 'smy:0', 'smx:0', 'smb:0', 'smt:0', 'smr:0', 'sml:0']
    )
})

it('validates scroll-margin rules', () => {
    testProp('sml:16', 'scroll-margin-left:1rem')
    testProp('smr:16', 'scroll-margin-right:1rem')
    testProp('smt:16', 'scroll-margin-top:1rem')
    testProp('smb:16', 'scroll-margin-bottom:1rem')
    testProp('sm:16', 'scroll-margin:1rem')
    testProp('smx:16', 'scroll-margin-left:1rem;scroll-margin-right:1rem')
    testProp('smy:16', 'scroll-margin-top:1rem;scroll-margin-bottom:1rem')
})