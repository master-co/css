import { defaultConfig } from './default-config';

export function configure(...configurations: any) {
    return configurations.length
        ? Object.assign(defaultConfig, ...configurations)
        : defaultConfig
}