import { expectOrderOfRules, testProp } from './css'

it('validates border-color rules', () => {
    testProp(['b:white', 'border:white', 'border-color:white'], 'border-color:#ffffff')
    testProp(['bb:white', 'border-bottom:white', 'border-bottom-color:white'], 'border-bottom-color:#ffffff')
    testProp(['bt:white', 'border-top:white', 'border-top-color:white'], 'border-top-color:#ffffff')
    testProp(['bl:white', 'border-left:white', 'border-left-color:white'], 'border-left-color:#ffffff')
    testProp(['br:white', 'border-right:white', 'border-right-color:white'], 'border-right-color:#ffffff')
    testProp(['bx:white', 'border-x:white', 'border-x-color:white'], 'border-left-color:#ffffff;border-right-color:#ffffff')
    testProp('border:white|solid', 'border:#ffffff solid')
})

it('checks border-color order', () => {
    expectOrderOfRules(
        ['bt:white', 'b:white', 'bl:white', 'bx:white'],
        ['b:white', 'bx:white', 'bl:white', 'bt:white']
    )
})