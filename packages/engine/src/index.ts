export { default as MasterCSS, default } from './core'
export type {
  CompiledUtility,
  MasterCSSCreateOptions,
  MasterCSSOptions,
  NativeCSSDeclaration,
  NativeCSSDeclarationMatcher
} from './core'
export type {
  MasterCSSClassInspection,
  MasterCSSInspectedClassVariable,
  MasterCSSNormalizedNumericValue
} from './inspect'
export { Rule } from './rule'
export { default as Layer } from './layer'
export { default as ThemeLayer } from './theme-layer'
export { default as UtilityLayer } from './utility-layer'
export { default as NonLayer } from './non-layer'
export { default as VariableRule } from './variable-rule'
export { default as AnimationRule } from './animation-rule'
export { default as compareRulePriority } from './utils/compare-rule-priority'
export { default as createHydrationManifest } from './hydration-manifest'
export { collectAnimationNamesFromDeclaration } from './utils/collect-animation-names'
export { builtinKeyAliases } from './key-aliases'
export type { MasterCSSBuiltinKeyAliases } from './key-aliases'
export {
  builtinNamespaces,
  builtinNamespaceRef,
  builtinNamespaceSet
} from './namespaces'
export type {
  MasterCSSBuiltinNamespace,
  MasterCSSBuiltinNamespaceRef
} from './namespaces'
export { builtinNativeValueNamespaces } from './native-value-namespaces'
export type {
  MasterCSSBuiltinNativeValueNamespace,
  MasterCSSBuiltinNativeValueNamespaces
} from './native-value-namespaces'
export { builtinSelectorAliases } from './selector-aliases'
export type { MasterCSSBuiltinSelectorAliases } from './selector-aliases'
export * from '@master/css-schema/manifest'
export type * from './emitted-globals'
export type { Utility as GeneratedRule } from './utility'
export type {
  MasterCSSGeneratedRuleIR,
  MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
