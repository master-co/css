import type { Rule } from '../rule'

export default function areRulesDuplicated(aRule: Rule, bRule: Rule) {
    const aKeys = Object.keys(aRule.declarations || {})
    const bKeys = Object.keys(bRule.declarations || {})

    if (aKeys.length !== bKeys.length) {
        return false
    }

    for (const key of aKeys) {
        if (!Object.prototype.hasOwnProperty.call(bRule.declarations, key)) {
            return false
        }
    }

    return true
}