import type { Rule } from '../rule'

export default function areRuleQueriesEqual(aRule: Rule, bRule: Rule) {
    const aQueryTypes = Object.keys(aRule.at)
    const bQueryTypes = Object.keys(bRule.at)

    if (aQueryTypes.length !== bQueryTypes.length) {
        return false
    }

    for (const aQueryType of aQueryTypes) {
        const aAtComponents = aRule.at[aQueryType]
        const bAtComponents = bRule.at[aQueryType]
        for (const aAtComponent of aAtComponents) {
            const aAtComponentToken = aRule.resolveAtComponent(aAtComponent)
            if (!bAtComponents.find(bAtComponent => bRule.resolveAtComponent(bAtComponent) === aAtComponentToken)) {
                return false
            }
        }
    }
    return true
}