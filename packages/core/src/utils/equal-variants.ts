import type { SyntaxRule } from '../syntax-rule'
import equalSelectors from './equal-selectors'
import equalAtRules from './equal-at-rules'

export default function equalVariants(a: SyntaxRule, b: SyntaxRule) {
    return a.mode === b.mode &&
        equalSelectors(a.selectorNodes, b.selectorNodes) &&
        equalAtRules(a.atRules, b.atRules)
}