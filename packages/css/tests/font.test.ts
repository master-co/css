import { testCSS } from './css'
import { fonts } from '../src'

test('font', () => {
    testCSS('font:italic|1.2rem|sans', `.font\\:italic\\|1\\.2rem\\|sans{font:italic 1.2rem ${fonts.sans.join(',')}}`)
    testCSS('font:italic|semibold|1.2rem|sans', `.font\\:italic\\|semibold\\|1\\.2rem\\|sans{font:italic 600 1.2rem ${fonts.sans.join(',')}}`)
})
