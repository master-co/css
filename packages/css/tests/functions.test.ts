import { testCSS, testProp } from './css'

test('functions', () => {
    testCSS('blur(32)', '.blur\\(32\\){filter:blur(2rem)}')
    testCSS('filter:invert(1)', '.filter\\:invert\\(1\\){filter:invert(1)}')

    testCSS('scale(.2)', '.scale\\(\\.2\\){transform:scale(.2)}')
    testCSS('translateX(40)', '.translateX\\(40\\){transform:translateX(2.5rem)}')

    testCSS('line-height:calc(32-16)', '.line-height\\:calc\\(32-16\\){line-height:calc(32 - 16)}')
    testCSS('font-size:calc(32-16)', '.font-size\\:calc\\(32-16\\){font-size:calc(2rem - 1rem)}')

    testCSS('width:max(0,16)', '.width\\:max\\(0\\,16\\){width:max(0rem,1rem)}')
    testCSS('box-shadow:0|2|3|rgba(0,0,0,.1)', '.box-shadow\\:0\\|2\\|3\\|rgba\\(0\\,0\\,0\\,\\.1\\){box-shadow:0rem 0.125rem 0.1875rem rgba(0,0,0,.1)}')

    testCSS('grid-template-cols:repeat(2,auto|.6|calc(3-max(2,1)))', '.grid-template-cols\\:repeat\\(2\\,auto\\|\\.6\\|calc\\(3-max\\(2\\,1\\)\\)\\){grid-template-columns:repeat(2,auto .6 calc(0.1875rem - max(0.125rem, 0.0625rem)))}')

    testCSS('mt:calc($(g-y)*-.1)', '.mt\\:calc\\(\\$\\(g-y\\)\\*-\\.1\\){margin-top:calc(var(--g-y) * -0.00625rem)}')
    testCSS('mt:calc($(g-y)*(-.1))', '.mt\\:calc\\(\\$\\(g-y\\)\\*\\(-\\.1\\)\\){margin-top:calc(var(--g-y) * (-0.00625rem))}')
    testCSS('mt:calc($(g-y)--.1)', '.mt\\:calc\\(\\$\\(g-y\\)--\\.1\\){margin-top:calc(var(--g-y) - -0.00625rem)}')
    testCSS('mr:calc($(g-x)/(-2px))', '.mr\\:calc\\(\\$\\(g-x\\)\\/\\(-2px\\)\\){margin-right:calc(var(--g-x) / (-2px))}')

    testCSS('$primary:red', '.\\$primary\\:red{--primary:#d11a1e}')
    testCSS('$primary:red-80', '.\\$primary\\:red-80{--primary:#fdcfcf}')
    testCSS('$primary:red/.5', '.\\$primary\\:red\\/\\.5{--primary:#d11a1e80}')
    testCSS('$primary:red-80/.5', '.\\$primary\\:red-80\\/\\.5{--primary:#fdcfcf80}')
})

test('checks gradient-related functions with color tokens', () => {
    testProp('bg:linear-gradient(0deg,gray-14|0%,gray-16|100%)', 'background-image:linear-gradient(0deg,#272628 0%,#29282a 100%)')
})