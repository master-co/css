import { defaultConfig } from './config';
import { MasterCSSConfig } from './interfaces/config';
import { extend } from './utils/extend';

export function configure(...configurations: MasterCSSConfig[]): MasterCSSConfig {
    if (configurations.length) {
        return extend(defaultConfig, ...configurations)
    } else {
        return defaultConfig
    }
}