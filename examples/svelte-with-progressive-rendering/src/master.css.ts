import MasterCSS from '@master/css'
import type { Config } from '@master/css'

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

export const css = new MasterCSS(config)
