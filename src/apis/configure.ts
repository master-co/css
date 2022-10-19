import defaultConfig from '../config'
import { MasterCSSConfig } from '../interfaces/config'
import { extend } from './extend'

export default function configure(...configurations: MasterCSSConfig[]): MasterCSSConfig {
    if (configurations.length) {
        return extend(defaultConfig, ...configurations)
    } else {
        return defaultConfig
    }
}