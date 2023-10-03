import { expectOrderOfRules, testProp } from './css'

it('checks scroll-padding order', () => {
    expectOrderOfRules(
        ['scroll-px:0', 'scroll-pl:0', 'scroll-pr:0', 'scroll-p:0', 'scroll-pt:0', 'scroll-pb:0', 'scroll-py:0'],
        ['scroll-p:0', 'scroll-px:0', 'scroll-py:0', 'scroll-pb:0', 'scroll-pl:0', 'scroll-pr:0', 'scroll-pt:0']
    )
})

it('validates scroll-padding rules', () => {
    testProp('scroll-pl:16', 'scroll-padding-left:1rem')
    testProp('scroll-pr:16', 'scroll-padding-right:1rem')
    testProp('scroll-pt:16', 'scroll-padding-top:1rem')
    testProp('scroll-pb:16', 'scroll-padding-bottom:1rem')
    testProp('scroll-p:16', 'scroll-padding:1rem')
    testProp('scroll-px:16', 'scroll-padding-left:1rem;scroll-padding-right:1rem')
    testProp('scroll-py:16', 'scroll-padding-top:1rem;scroll-padding-bottom:1rem')
    testProp('scroll-padding-x:16', 'scroll-padding-left:1rem;scroll-padding-right:1rem')
    testProp('scroll-padding-y:16', 'scroll-padding-top:1rem;scroll-padding-bottom:1rem')
})