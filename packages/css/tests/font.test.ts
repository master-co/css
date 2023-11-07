import { testCSS } from './css'
import MasterCSS, { variables } from '../src'

it('font', () => {
    testCSS('font:italic|1.2rem|sans', `.font\\:italic\\|1\\.2rem\\|sans{font:italic 1.2rem ${variables.font.family.sans.join(',')}}`)
    testCSS('font:italic|semibold|1.2rem|sans', `.font\\:italic\\|semibold\\|1\\.2rem\\|sans{font:italic 600 1.2rem ${variables.font.family.sans.join(',')}}`)
})
