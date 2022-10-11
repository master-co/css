import colors from './colors'
import breakpoints from './breakpoints'
import semantics from './semantics'
import values from './values'
import selectors from './selectors'
import themes from './themes'
import { Rules } from './rules'
import { MasterCSSConfig } from './interfaces/config'

export const defaultConfig: MasterCSSConfig = {
    colors,
    breakpoints,
    semantics,
    values,
    selectors,
    Rules,
    themes,
    rootSize: 16
}
