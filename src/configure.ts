import colors from './colors'
import breakpoints from './breakpoints'
import semantics from './semantics'
import values from './values'
import { Rules } from './rules'

export const defaultConfig = {
    colors,
    breakpoints,
    semantics,
    values,
    Rules,

}

export function configure(...configurations: any) {
    return configurations.length
        ? Object.assign(defaultConfig, ...configurations)
        : defaultConfig
}