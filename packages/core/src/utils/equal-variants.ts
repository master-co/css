import type { Utility } from '../utility'
import equalSelectors from './equal-selectors'
import equalAtRules from './equal-at-rules'

export default function equalVariants(a: Utility, b: Utility) {
    return a.mode === b.mode &&
        equalSelectors(a.selectorNodes, b.selectorNodes) &&
        equalAtRules(a.atRules, b.atRules)
}