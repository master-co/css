// core
export { default } from './css'
export { default as Rule } from './rule'

// api
export { default as extend } from 'to-extend'
export { default as render } from './apis/render'
export { default as renderFromHTML } from './apis/render-from-html'
export { default as renderIntoHTML } from './apis/render-into-html'
export { default as fillColorScale } from './apis/fill-color-scale'

// config
export { default as config } from './config'
export { default as breakpoints } from './config/breakpoints'
export { default as colors } from './config/colors'
export { default as rootSize } from './config/root-size'
export { default as selectors } from './config/selectors'
export { default as semantics } from './config/semantics'
export { default as themes } from './config/themes'
export { default as scheme } from './config/scheme'
export { default as values } from './config/values'
export { default as Rules } from './config/rules'

// other
export const root: Document = typeof document !== 'undefined' && document

// type
export type { Config } from './config'
export type { Declaration, MediaQuery, MediaFeatureRule, RuleMatching } from './rule'
export type { Options } from './css'
