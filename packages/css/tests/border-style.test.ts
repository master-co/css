import { expectOrderOfRules, testProp } from './css'

it('validates border-radius rules', () => {
    testProp('b:solid', 'border-style:solid')
    testProp('border:solid', 'border-style:solid')
    testProp('border-style:solid', 'border-style:solid')

    testProp('bb:solid', 'border-bottom-style:solid')
    testProp('border-bottom:solid', 'border-bottom-style:solid')
    testProp('border-bottom-style:solid')

    testProp('bt:solid', 'border-top-style:solid')
    testProp('border-top:solid', 'border-top-style:solid')
    testProp('border-top-style:solid')

    testProp('bl:solid', 'border-left-style:solid')
    testProp('border-left:solid', 'border-left-style:solid')
    testProp('border-left-style:solid')

    testProp('br:solid', 'border-right-style:solid')
    testProp('border-right:solid', 'border-right-style:solid')
    testProp('border-right-style:solid')
})

it('checks border-radius order', () => {
    expectOrderOfRules(
        ['bt:solid', 'b:solid', 'bl:dotted'],
        ['b:solid', 'bl:dotted', 'bt:solid']
    )
})