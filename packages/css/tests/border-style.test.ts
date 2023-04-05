import { expectOrderOfRules, testProp } from './css'

it('validates border-style rules', () => {
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

    testProp('border:solid|1', 'border:solid 0.0625rem')
})

it('checks border-style order', () => {
    expectOrderOfRules(
        ['bt:solid', 'b:solid', 'bl:dotted'],
        ['b:solid', 'bl:dotted', 'bt:solid']
    )
})