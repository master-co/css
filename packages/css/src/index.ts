export * from './config'
export * from './rule'
export { Rule } from './rule'
export { Layer } from './layer'
export { default as MasterCSS, default } from './core'

// functions
export { default as extendConfig } from './functions/extend-config'
export { default as reorderForReadableClasses } from './functions/reorder-for-readable-classes'
export { default as areRuleModesEqual } from './functions/are-rule-modes-equal'
export { default as areRuleQueriesEqual } from './functions/are-rule-queries-equal'
export { default as areRuleSelectorsEqual } from './functions/are-rule-selectors-equal'
export { default as areRuleStatesEqual } from './functions/are-rule-states-equal'
export { default as areRulesDuplicated } from './functions/are-rules-duplicated'

export type { NativeRule, MediaFeatureComponent, MediaQuery } from './rule'