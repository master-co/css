import { Config, CoreLayer } from '../../../src'
import { testCSS } from '../../css'

const customConfig: Config = {
  override: true,
  rootSize: 10,
  rules: {
    fontSize: {
      match: ['custom'],
      numeric: true,
      unit: 'rem',
      layer: CoreLayer.Native,
    },
  },
}

test('override', () => {
  testCSS('font:16', '', customConfig)
  testCSS('custom:16', '.custom\\:16{font-size:1.6rem}', customConfig)
})
