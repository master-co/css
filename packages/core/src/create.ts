import type { Config } from 'shared/css-config'
import type { MasterCSSPreloaded } from 'shared/css-preloaded-module'
import defaultConfig from './config'
import MasterCSS from './core'
import extendConfig from './utils/extend-config'

export default function createCSS(config?: Config, preloaded?: MasterCSSPreloaded) {
    return new MasterCSS(extendConfig(defaultConfig, config), preloaded)
}
