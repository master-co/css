import { testProp } from './css'

it('font-size', () => {
    testProp('font:16', 'font-size:1rem')
    testProp('font:.5', 'font-size:0.03125rem')
    testProp('font:min(10,calc(25-10))', 'font-size:min(0.625rem,calc(1.5625rem - 0.625rem))')
    // prevents font-size from being mapped to font shorthand
    testProp('font:1.2rem|"Fira Sans",sans-serif', 'font:1.2rem "Fira Sans",sans-serif')
})