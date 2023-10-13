import { testCSS, testProp } from './css'

test('text-decoration color', () => {
    testCSS('text-decoration:#000', '.text-decoration\\:\\#000{text-decoration-color:#000}')
    // testCSS('text-decoration:rgb(0,0,0)', '.text-decoration\\:rgb\\(0\\,0\\,0\\){text-decoration-color:rgb(0,0,0)}')
    // testCSS('text-decoration:oklab(0%,0,0)', '.text-decoration\\:oklab\\(0\\%\\,0\\,0\\){text-decoration-color:oklab(0%,0,0)}')
})

// test('text-decoration style', () => {
//     testCSS('text:solid', '.text\\:solid{text-decoration-style:solid}')
// })