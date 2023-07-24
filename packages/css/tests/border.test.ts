import { expectOrderOfRules, testProp } from './css'

it('validates border rules', () => {
    testProp(['b:16|solid', 'border:16|solid'], 'border:1rem solid')
    testProp(['bt:16|solid', 'border-top:16|solid'], 'border-top:1rem solid')
    testProp(['bb:16|solid', 'border-bottom:16|solid'], 'border-bottom:1rem solid')
    testProp(['bl:16|solid', 'border-left:16|solid'], 'border-left:1rem solid')
    testProp(['br:16|solid', 'border-right:16|solid'], 'border-right:1rem solid')
    testProp(['bx:16|solid', 'border-x:16|solid'], 'border-left:1rem solid;border-right:1rem solid')
    testProp(['by:16|solid', 'border-y:16|solid'], 'border-top:1rem solid;border-bottom:1rem solid')

    testProp(['br:1px|solid|gray'], 'border-right:1px solid #6b6a6d')
    testProp(['br:1px|gray'], 'border-right:1px #6b6a6d solid')
})

it('checks border order', () => {
    expectOrderOfRules(
        ['bt:1|solid', 'b:1|solid', 'br:1|solid'],
        ['b:1|solid', 'br:1|solid', 'bt:1|solid']
    )
})