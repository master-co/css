import defaultConfig from '../config'
import type { MasterCSSConfig } from '../config'
import extend from './extend'

export default function configure(...configurations: MasterCSSConfig[]): MasterCSSConfig {
    if (configurations.length) {
        return extend(defaultConfig, ...configurations)
    } else {
        return defaultConfig
    }
}