import { testCSS, testProp } from '../../css'

test('functions', () => {
    testCSS('blur(32)', '.blur\\(32\\){filter:blur(2rem)}')
    testCSS('filter:invert(1)', '.filter\\:invert\\(1\\){filter:invert(1)}')

    testCSS('scale(.2)', '.scale\\(\\.2\\){transform:scale(.2)}')
    testCSS('translateX(40)', '.translateX\\(40\\){transform:translateX(2.5rem)}')

    testCSS('width:max(0,16)', '.width\\:max\\(0\\,16\\){width:max(0rem,1rem)}')
    testCSS('box-shadow:0|2|3|rgba(0,0,0,.1)', '.box-shadow\\:0\\|2\\|3\\|rgba\\(0\\,0\\,0\\,\\.1\\){box-shadow:0rem 0.125rem 0.1875rem rgba(0,0,0,.1)}')

    testCSS('grid-template-cols:repeat(2,auto|.6|calc(3-max(2,1)))', '.grid-template-cols\\:repeat\\(2\\,auto\\|\\.6\\|calc\\(3-max\\(2\\,1\\)\\)\\){grid-template-columns:repeat(2,auto .6 calc(0.1875rem - max(2, 1) / 16 * 1rem))}')

    testCSS('$primary:red', '.\\$primary\\:red{--primary:rgb(209 26 30)}')
    testCSS('$primary:red-80', '.\\$primary\\:red-80{--primary:rgb(253 207 207)}')
    testCSS('$primary:red/.5', '.\\$primary\\:red\\/\\.5{--primary:rgb(209 26 30/.5)}')
    testCSS('$primary:red-80/.5', '.\\$primary\\:red-80\\/\\.5{--primary:rgb(253 207 207/.5)}')
})

test('checks gradient-related functions with color variables', () => {
    testProp('bg:linear-gradient(0deg,gray-14|0%,gray-16|100%)', 'background-image:linear-gradient(0deg,rgb(39 38 40) 0%,rgb(41 40 42) 100%)')
})