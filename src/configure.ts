import { defaultConfig } from './configs';
import { MasterCSSConfig } from './interfaces/config';
import { mergeAndConcat } from './utils/merge';

export function configure(...configurations: MasterCSSConfig[]): MasterCSSConfig {
    if (configurations.length) {
        return mergeAndConcat(defaultConfig, ...configurations)
    } else {
        return defaultConfig
    }
}