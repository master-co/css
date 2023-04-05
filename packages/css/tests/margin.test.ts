import { expectOrderOfRules, testProp } from './css'

it('checks margin order', () => {
    expectOrderOfRules(
        ['mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0'],
        ['m:0', 'my:0', 'mx:0', 'mb:0', 'mt:0', 'mr:0', 'ml:0']
    )
})

it('validate output CSS rules', () => {
    testProp('ml:16', 'margin-left:1rem')
    testProp('mr:16', 'margin-right:1rem')
    testProp('mt:16', 'margin-top:1rem')
    testProp('mb:16', 'margin-bottom:1rem')
    testProp('m:16', 'margin:1rem')
    testProp('mx:16', 'margin-left:1rem;margin-right:1rem')
    testProp('my:16', 'margin-top:1rem;margin-bottom:1rem')
})