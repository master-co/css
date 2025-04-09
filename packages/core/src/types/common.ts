import SyntaxRuleType from '../syntax-rule-type'

export type Vendors = 'webkit' | 'moz' | 'ms' | 'o'
export type SyntaxRuleTypeValue = typeof SyntaxRuleType[keyof typeof SyntaxRuleType]
