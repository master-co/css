import viewports from './viewports'
import colors from './colors'
import selectors from './selectors'
import semantics from './semantics'
import animations from './animations'
import rules, { type Rules } from './rules'
import functions from './functions'
import fonts from './fonts'
import { CSSDeclarations } from 'src/types/css-declarations'
import type { Rule } from '../rule'
import type { MasterCSS } from '../core'

const config: Config = {
    viewports,
    colors,
    selectors,
    semantics,
    rules,
    fonts,
    functions,
    animations,
    scope: '',
    rootSize: 16,
    override: false,
    important: false,
    themeDriver: 'class'
}

export {
    config,
    viewports,
    colors,
    selectors,
    semantics,
    rules,
    fonts,
    functions,
    animations,
    Rules
}

type ExtendedValues = { [key: string]: string | number | ExtendedValues }

export interface Config {
    extends?: (Config | { config: Config })[]
    classes?: { [key: string]: string | Config['classes'] }
    colors?: { [key: string]: string | Config['colors'] }
    viewports?: { [key: string]: number | Config['viewports'] }
    mediaQueries?: { [key: string]: string | Config['mediaQueries'] }
    selectors?: { [key: string]: string | string[] | Config['selectors'] }
    semantics?: { [key in keyof typeof semantics]?: CSSDeclarations } & { [key: string]: CSSDeclarations }
    values?: ExtendedValues | ((this: MasterCSS, resolvedValues: Record<string, Record<string, string | number>>) => ExtendedValues)
    fonts?: { [key: string]: string | string[] } | ((css: MasterCSS) => Config['fonts'])
    rules?: Rules
    rootSize?: number
    scope?: string
    important?: boolean
    override?: boolean
    functions?: Record<string, {
        unit?: string
        name?: string
        transform?(this: Rule, value: string): string
    }>,
    animations?: Record<string, { [key in 'from' | 'to']?: CSSDeclarations } & { [key: string]: CSSDeclarations }>
    themeDriver?: 'class' | 'media' | 'host'
}