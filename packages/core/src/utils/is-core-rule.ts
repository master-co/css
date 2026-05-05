import rules from '../config/rules'
import SyntaxRuleType from '../syntax-rule-type'

export default function isCoreRule(id: string) {
    return rules.some((rule) => (rule.type === SyntaxRuleType.Utility ? '.' + rule.name : rule.name) === id)
}
