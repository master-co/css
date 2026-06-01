import type { Config } from 'shared/css-config'
import config from './config'
import MasterCSS from './core'

export default function createCSS(customConfig?: Config) {
    return new MasterCSS(config, customConfig)
}
