import { testProp, testCSS } from './css'

test('background', () => {
    testProp('bg:red', 'background-color:#d11a1e')
    testProp('bg:#fff', 'background-color:#fff')
    testCSS('bg:gray-90:hover@md@landscape', '@media (min-width:1024px) and (orientation:landscape){.bg\\:gray-90\\:hover\\@md\\@landscape:hover{background-color:#ecebee}}')
    testProp('bg:transparent', 'background-color:transparent')
    testProp('bg:current', 'background-color:currentColor')
    testProp('background-clip:border', '-webkit-background-clip:border-box;background-clip:border-box')
    testProp('bg:url(\'#test\')', 'background-image:url(\'#test\')')
    testProp('bg:gray-50|url(\'/images/wallpaper.jpg\')|no-repeat|top|left/cover', 'background:#6b6a6d url(\'/images/wallpaper.jpg\') no-repeat top left/cover')
    testProp('gradient(45deg,#f3ec78,#af4261)', 'background-image:linear-gradient(45deg,#f3ec78,#af4261)')
})

it('gradient-related functions should transform "current" to "currentColor"', () => {
    testProp('bg:conic-gradient(current,black)', 'background-image:conic-gradient(currentColor,#000000)')
    testProp('bg:linear-gradient(current,black)', 'background-image:linear-gradient(currentColor,#000000)')
    testProp('bg:radial-gradient(current,black)', 'background-image:radial-gradient(currentColor,#000000)')
    testProp('bg:repeating-linear-gradient(current,black)', 'background-image:repeating-linear-gradient(currentColor,#000000)')
    testProp('bg:repeating-radial-gradient(current,black)', 'background-image:repeating-radial-gradient(currentColor,#000000)')
})