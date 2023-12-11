import { Config, Layer } from '../../../src'

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
    expect(new MasterCSS(customConfig).create('font:16')).toBeUndefined()
    expect(new MasterCSS(customConfig).create('custom:16')?.text).toBe('.custom\\:16{font-size:1.6rem}')
})
