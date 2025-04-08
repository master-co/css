import { AT_IDENTIFIERS } from '../common'
import type { SyntaxRule } from '../syntax-rule'
import { AtRuleNode } from '../utils/parse-at'

function areComponentsEqual(a: any, b: any): boolean {
    return (
        a.type === b.type &&
        a.value === b.value &&
        a.unit === b.unit &&
        a.name === b.name &&
        a.operator === b.operator &&
        areComponentArraysEqual(a.children ?? [], b.children ?? [])
    )
}

function areComponentArraysEqual(aComps: AtRuleNode[], bComps: AtRuleNode[]): boolean {
    if (aComps.length !== bComps.length) return false

    const matched = new Array(bComps.length).fill(false)

    for (const aComp of aComps) {
        const index = bComps.findIndex((bComp, i) => !matched[i] && areComponentsEqual(aComp, bComp))
        if (index === -1) return false
        matched[index] = true
    }

    return true
}

export default function areRuleAtEqual(a: SyntaxRule, b: SyntaxRule) {
    return AT_IDENTIFIERS.every(key =>
        areComponentArraysEqual(a.atRules?.[key] ?? [], b.atRules?.[key] ?? [])
    )
}