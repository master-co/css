// core
export * from './css'
export * from './rule'
export * from './theme'
export { MasterCSS as default } from './css'

// methods
export { default as extend } from 'to-extend'
export * from './methods'

// config
export * from './config'

// type
export type { Declaration, MediaQuery, MediaFeatureRule, RuleMeta } from './rule'
export type { ThemeConfig, ThemeValue } from './theme'

import './init'