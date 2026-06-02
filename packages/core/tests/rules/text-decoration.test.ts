import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('text-decoration color', () => {
    expect(createCSSWithTheme().create('text-decoration:#000')?.text).toBe('.text-decoration\\:\\#000{text-decoration-color:#000}')
    // expect(createCSSWithTheme().create('text-decoration:rgb(0,0,0)')?.text).toBe('.text-decoration\\:rgb\\(0\\,0\\,0\\){text-decoration-color:rgb(0,0,0)}')
    // expect(createCSSWithTheme().create('text-decoration:oklab(0%,0,0)')?.text).toBe('.text-decoration\\:oklab\\(0\\%\\,0\\,0\\){text-decoration-color:oklab(0%,0,0)}')
})

// test.concurrent('text-decoration style', () => {
//     expect(createCSSWithTheme().create('text:solid')?.text).toBe('.text\\:solid{text-decoration-style:solid}')
// })