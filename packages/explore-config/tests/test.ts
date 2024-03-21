import exploreConfig from '../src'
import config from './master.css'

test('basic', () => {
    expect(exploreConfig({ cwd: __dirname })).toBe(config)
})