import { MasterCSSConfig } from '../interfaces/config'
import defaultBreakpoints from './breakpoints'
import defaultColors from './colors'
import defaultRootSize from './root-size'
import defaultSelectors from './selectors'
import defaultSemantics from './semantics'
import defaultThemes from './themes'
import defaultValues from './values'
import DefaultRules from './rules'

const defaultConfig: MasterCSSConfig = {
    colors: defaultColors,
    breakpoints: defaultBreakpoints,
    semantics: defaultSemantics,
    values: defaultValues,
    selectors: defaultSelectors,
    themes: defaultThemes,
    Rules: DefaultRules,
    rootSize: defaultRootSize
}

export default defaultConfig