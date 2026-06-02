import type { Config } from 'shared/css-config'
import defaultConfig from './config'
import MasterCSS from './core'
import extendConfig from './utils/extend-config'

export default function createCSS(config?: Config) {
    return new MasterCSS(extendConfig(defaultConfig, config))
}
