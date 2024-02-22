import './src'
import '@types/jest'

import { default as _MasterCSS } from './src/core'

declare global {
    var MasterCSS: typeof _MasterCSS
    var masterCSSs: _MasterCSS[]
}