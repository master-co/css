import { expectOrderOfRules, testProp } from './css'

it('validates border-width rules', () => {
    testProp('b:16', 'border-width:1rem')
    testProp('border:16', 'border-width:1rem')
    testProp('border-width:16', 'border-width:1rem')

    testProp('bb:16', 'border-bottom-width:1rem')
    testProp('border-bottom:16', 'border-bottom-width:1rem')
    testProp('border-bottom-width:1rem')

    testProp('bt:16', 'border-top-width:1rem')
    testProp('border-top:16', 'border-top-width:1rem')
    testProp('border-top-width:1rem')

    testProp('bl:16', 'border-left-width:1rem')
    testProp('border-left:16', 'border-left-width:1rem')
    testProp('border-left-width:1rem')

    testProp('br:16', 'border-right-width:1rem')
    testProp('border-right:16', 'border-right-width:1rem')
    testProp('border-right-width:1rem')

    testProp('border:16|solid', 'border:1rem solid')
})

it('checks border-width order', () => {
    expectOrderOfRules(
        ['bt:16', 'b:16', 'bl:dotted'],
        ['b:16', 'bl:dotted', 'bt:16']
    )
})