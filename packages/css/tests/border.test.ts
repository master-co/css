import { expectOrderOfRules, testProp } from './css'

test('border', () => {
    testProp('border:current', 'border-color:currentColor')
    testProp('border:transparent', 'border-color:transparent')
    testProp('border:black', 'border-color:rgb(0 0 0)')
    testProp('border:2|black', 'border:0.125rem rgb(0 0 0)')
    testProp('border:1', 'border-width:0.0625rem')
    testProp('border:dashed|black', 'border:dashed rgb(0 0 0)')
    testProp('border:solid', 'border-style:solid')
    testProp('border:1rem|solid', 'border:1rem solid')
    testProp('border:thick|double|black', 'border:thick double rgb(0 0 0)')
    testProp('border:none', 'border:none')
    testProp('border:unset', 'border:unset')
    testProp('border:inherit', 'border:inherit')
    testProp('border:initial', 'border:initial')
    testProp('border:revert', 'border:revert')
    testProp('border:revert-layer', 'border:revert-layer')
    testProp('border:auto', 'border:auto')
    testProp('border:auto|1', 'border:auto 0.0625rem')
})

it('validates border rules', () => {
    testProp(['b:16|solid', 'border:16|solid'], 'border:1rem solid')
    testProp(['bt:16|solid', 'border-top:16|solid'], 'border-top:1rem solid')
    testProp(['bb:16|solid', 'border-bottom:16|solid'], 'border-bottom:1rem solid')
    testProp(['bl:16|solid', 'border-left:16|solid'], 'border-left:1rem solid')
    testProp(['br:16|solid', 'border-right:16|solid'], 'border-right:1rem solid')
    testProp(['bx:16|solid', 'border-x:16|solid'], 'border-left:1rem solid;border-right:1rem solid')
    testProp(['by:16|solid', 'border-y:16|solid'], 'border-top:1rem solid;border-bottom:1rem solid')

    testProp(['br:1px|solid|gray'], 'border-right:1px solid rgb(107 106 109)')
    testProp(['br:1px|gray'], 'border-right:1px rgb(107 106 109)')
})

it('checks border order', () => {
    expectOrderOfRules(
        ['bt:1|solid', 'b:1|solid', 'br:1|solid'],
        ['b:1|solid', 'br:1|solid', 'bt:1|solid']
    )
})