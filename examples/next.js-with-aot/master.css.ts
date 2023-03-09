import { Config } from '@master/css'
import { Options } from '@master/css-compiler'

export const config: Config = {
    themes: {},
    colors: {},
    classes: {},
    values: {},
    semantics: {},
    breakpoints: {},
    selectors: {},
    mediaQueries: {}
}

export const compilerOptions: Options = {
    sources: [],
    classes: {
        fixed: [],
        ignored: []
    }
}
