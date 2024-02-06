import { join } from 'path'
import testGeneratedCSS from '../../test-generated-css'

test('render', () => {
    testGeneratedCSS(
        join(__dirname, './template.html'),
        require('./config').default,
        join(__dirname, './generated.css')
    )
})
