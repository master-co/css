import { Config, Layer } from '../../../src'
import { testCSS } from '../../css'

const customConfig: Config = {
    override: true,
    rootSize: 10,
    rules: {
        'font-size': {
            match: ['custom'],
            numeric: true,
            unit: 'rem',
            layer: Layer.Normal,
        }
    }
}

test('override', () => {
    testCSS('font:16', '', customConfig)
    testCSS('custom:16', '.custom\\:16{font-size:1.6rem}', customConfig)
})
