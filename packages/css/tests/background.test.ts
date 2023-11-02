import { testProp, testCSS } from './css'

test('background', () => {
    testProp('bg:red', 'background-color:rgb(209 26 30)')
    testProp('bg:#fff', 'background-color:#fff')
    testCSS('bg:gray-90:hover@md@landscape', '@media (min-width:1024px) and (orientation:landscape){.bg\\:gray-90\\:hover\\@md\\@landscape:hover{background-color:rgb(236 235 238)}}')
    testProp('bg:transparent', 'background-color:transparent')
    testProp('bg:current', 'background-color:currentColor')
    testProp('background-clip:border', '-webkit-background-clip:border-box;background-clip:border-box')
    testProp('bg:url(\'#test\')', 'background-image:url(\'#test\')')
    testProp('bg:gray-50|url(\'/images/wallpaper.jpg\')|no-repeat|top|left/cover', 'background:rgb(107 106 109) url(\'/images/wallpaper.jpg\') no-repeat top left/cover')
    testProp('gradient(45deg,#f3ec78,#af4261)', 'background-image:linear-gradient(45deg,#f3ec78,#af4261)')
})

it('gradient-related functions should transform "current" to "currentColor"', () => {
    testProp('bg:conic-gradient(current,black)', 'background-image:conic-gradient(currentColor,rgb(0 0 0))')
    testProp('bg:linear-gradient(current,black)', 'background-image:linear-gradient(currentColor,rgb(0 0 0))')
    testProp('bg:radial-gradient(current,black)', 'background-image:radial-gradient(currentColor,rgb(0 0 0))')
    testProp('bg:repeating-linear-gradient(current,black)', 'background-image:repeating-linear-gradient(currentColor,rgb(0 0 0))')
    testProp('bg:repeating-radial-gradient(current,black)', 'background-image:repeating-radial-gradient(currentColor,rgb(0 0 0))')
})