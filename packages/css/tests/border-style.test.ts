import { expectOrderOfRules, testProp } from './css'

it('validates border-style rules', () => {
    testProp(['b:solid', 'border:solid', 'border-style:solid'], 'border-style:solid')
    testProp(['bb:solid', 'border-bottom:solid', 'border-bottom-style:solid'], 'border-bottom-style:solid')
    testProp(['bt:solid', 'border-top:solid', 'border-top-style:solid'], 'border-top-style:solid')
    testProp(['bl:solid', 'border-left:solid', 'border-left-style:solid'], 'border-left-style:solid')
    testProp(['br:solid', 'border-right:solid', 'border-right-style:solid'], 'border-right-style:solid')
    testProp(['bx:solid', 'border-x:solid', 'border-x-style:solid'], 'border-left-style:solid;border-right-style:solid')
    testProp('border:solid|1', 'border:solid 0.0625rem')
})

it('checks border-style order', () => {
    expectOrderOfRules(
        ['bt:solid', 'b:solid', 'bl:dotted'],
        ['b:solid', 'bl:dotted', 'bt:solid']
    )
})