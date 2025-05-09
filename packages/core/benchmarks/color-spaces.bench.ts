import { bench } from 'vitest'
import MasterCSS from '../src'
import hexColors from './fixtures/hex-colors'
import rgbColors from './fixtures/rgb-colors'

bench('with hex', () => {
    new MasterCSS(hexColors)
})

bench('with rgb', () => {
    new MasterCSS(rgbColors)
})