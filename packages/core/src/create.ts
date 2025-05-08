import type { Config } from './types/config'
import { config } from './config'
import MasterCSS from './core'

export default function createCSS(customConfig?: Config) {
    return new MasterCSS(customConfig, config)
}