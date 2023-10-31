import { expectOrderOfRules, testProp } from './css'

it('validates border-color rules', () => {
    testProp(['b:white', 'border:white', 'border-color:white'], 'border-color:rgb(255 255 255)')
    testProp(['bb:white', 'border-bottom:white', 'border-bottom-color:white'], 'border-bottom-color:rgb(255 255 255)')
    testProp(['bt:white', 'border-top:white', 'border-top-color:white'], 'border-top-color:rgb(255 255 255)')
    testProp(['bl:white', 'border-left:white', 'border-left-color:white'], 'border-left-color:rgb(255 255 255)')
    testProp(['br:white', 'border-right:white', 'border-right-color:white'], 'border-right-color:rgb(255 255 255)')
    testProp(['bx:white', 'border-x:white', 'border-x-color:white'], 'border-left-color:rgb(255 255 255);border-right-color:rgb(255 255 255)')
    testProp('border:white|solid', 'border:rgb(255 255 255) solid')
})

it('checks border-color order', () => {
    expectOrderOfRules(
        ['bt:white', 'b:white', 'bl:white', 'bx:white'],
        ['b:white', 'bx:white', 'bl:white', 'bt:white']
    )
})