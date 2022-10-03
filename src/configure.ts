import colors from './colors'
import breakpoints from './breakpoints'
import { Rules } from './rules'

export const defaultConfig = {
    colors,
    breakpoints,
    Rules
}

export function configure(...configurations: any) {
    return configurations.length
        ? Object.assign(defaultConfig, ...configurations)
        : defaultConfig
}