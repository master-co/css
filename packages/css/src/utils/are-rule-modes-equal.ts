import type { Rule } from '../rule'

export default function areRuleModesEqual(aRule: Rule, bRule: Rule) {
    return aRule.mode === bRule.mode
}