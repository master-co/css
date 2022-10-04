import colors from './colors'
import breakpoints from './breakpoints'
import semantics from './semantics'
import { Rules } from './rules'

export const defaultConfig = {
    colors,
    breakpoints,
    semantics,
    Rules,

}

export function configure(...configurations: any) {
    return configurations.length
        ? Object.assign(defaultConfig, ...configurations)
        : defaultConfig
}