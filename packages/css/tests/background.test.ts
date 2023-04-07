import { testProp, testCSS } from './css'

test('background', () => {
    testProp('bg:red', 'background-color:#d11a1e')
    testProp('bg:#fff', 'background-color:#fff')

    testCSS('bg:gray-90:hover@md@landscape', '@media (min-width:1024px) and (orientation:landscape){.bg\\:gray-90\\:hover\\@md\\@landscape:hover{background-color:#ecebee}}')

    testProp('bg:transparent', 'background-color:transparent')
    testProp('bg:current', 'background-color:currentColor')

    testProp('background-clip:border', '-webkit-background-clip:border-box;background-clip:border-box')

    testProp('bg:linear-gradient(0deg,gray-14|0%,gray-16|100%)', 'background-image:linear-gradient(0deg,#272628 0%,#29282a 100%)')

    testProp('bg:url(\'#test\')', 'background-image:url(\'#test\')')

    testProp('bg:gray-50|url(\'/images/wallpaper.jpg\')|no-repeat|top|left/cover', 'background:#6b6a6d url(\'/images/wallpaper.jpg\') no-repeat top left/cover')
})
