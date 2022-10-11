import defaultColors from './colors'
import defaultBreakpoints from './breakpoints'
import defaultSemantics from './semantics'
import defaultValues from './values'
import defaultSelectors from './selectors'
import defaultThemes from './themes'
import { MasterCSSConfig } from '../interfaces/config'

const defaultConfig: MasterCSSConfig = {
    colors: defaultColors,
    breakpoints: defaultBreakpoints,
    semantics: defaultSemantics,
    values: defaultValues,
    selectors: defaultSelectors,
    themes: defaultThemes,
    rootSize: 16
}

export {
    defaultColors,
    defaultBreakpoints,
    defaultSemantics,
    defaultValues,
    defaultSelectors,
    defaultThemes,
    defaultConfig
}