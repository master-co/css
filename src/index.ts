// core
export { default } from './css'
export { default as MasterCSSRule } from './rule'

// api
export { default as extend } from './apis/extend'
export { default as render } from './apis/render'
export { default as renderFromHTML } from './apis/render-from-html'
export { default as renderIntoHTML } from './apis/render-into-html'
export { default as fillColorScale } from './apis/fill-color-scale'

// config
export { default as defaultConfig } from './config'
export { default as defaultBreakpoints } from './config/breakpoints'
export { default as defaultColors } from './config/colors'
export { default as defaultRootSize } from './config/root-size'
export { default as defaultSelectors } from './config/selectors'
export { default as defaultSemantics } from './config/semantics'
export { default as defaultThemes } from './config/themes'
export { default as defaultScheme } from './config/scheme'
export { default as defaultValues } from './config/values'
export { default as DefaultRules } from './config/rules'

// other
export const root: Document = typeof document !== 'undefined' && document

// type
export type { MasterCSSConfig } from './config'
export type { MasterCSSDeclaration, MasterCSSMedia, MasterCSSMediaFeatureRule, MasterCSSRuleMatching } from './rule'
export type { MasterCSSOptions } from './css'
