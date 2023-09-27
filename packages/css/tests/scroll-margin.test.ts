import { expectOrderOfRules, testProp } from './css'

it('checks scroll-margin order', () => {
    expectOrderOfRules(
        ['scroll-mx:0', 'scroll-ml:0', 'scroll-mr:0', 'scroll-m:0', 'scroll-mt:0', 'scroll-mb:0', 'scroll-my:0'],
        ['scroll-m:0', 'scroll-mx:0', 'scroll-my:0', 'scroll-mb:0', 'scroll-ml:0', 'scroll-mr:0', 'scroll-mt:0']
    )
})

it('validates scroll-margin rules', () => {
    testProp('scroll-ml:16', 'scroll-margin-left:1rem')
    testProp('scroll-mr:16', 'scroll-margin-right:1rem')
    testProp('scroll-mt:16', 'scroll-margin-top:1rem')
    testProp('scroll-mb:16', 'scroll-margin-bottom:1rem')
    testProp('scroll-m:16', 'scroll-margin:1rem')
    testProp('scroll-mx:16', 'scroll-margin-left:1rem;scroll-margin-right:1rem')
    testProp('scroll-my:16', 'scroll-margin-top:1rem;scroll-margin-bottom:1rem')
    testProp('scroll-margin-x:16', 'scroll-margin-left:1rem;scroll-margin-right:1rem')
    testProp('scroll-margin-y:16', 'scroll-margin-top:1rem;scroll-margin-bottom:1rem')
})