import viewports, { type Viewports } from './viewports'
import colors, { type Colors } from './colors'
import selectors, { type Selectors } from './selectors'
import semantics, { type Semantics } from './semantics'
import animations, { type Animations } from './animations'
import rules, { type Rules } from './rules'
import functions, { type Functions } from './functions'
import rootSize from './root-size'
import scope from './scope'
import override from './override'
import important from './important'
import themeDriver, { type ThemeDriver } from './theme-driver'
import type { MediaQueries } from './media-queries'
import type { Values } from './values'
import type { Classes } from './classes'

const config: Config = {
    viewports,
    colors,
    rootSize,
    scope,
    selectors,
    semantics,
    rules,
    override,
    important,
    functions,
    animations,
    themeDriver
}

export {
    config,
    viewports,
    colors,
    rootSize,
    scope,
    selectors,
    semantics,
    rules,
    override,
    important,
    functions,
    animations,
    themeDriver,
    Viewports,
    Colors,
    MediaQueries,
    Values,
    Classes,
    Selectors,
    Semantics,
    Rules,
    Functions,
    Animations,
    ThemeDriver
}

export interface Config {
    extends?: (Config | { config: Config })[]
    classes?: Classes
    colors?: Colors
    viewports?: Viewports
    mediaQueries?: MediaQueries
    selectors?: Selectors
    semantics?: Semantics
    values?: Values
    rules?: Rules
    rootSize?: number
    scope?: string
    important?: boolean
    override?: boolean
    functions?: Functions
    animations?: Animations
    themeDriver?: ThemeDriver
}