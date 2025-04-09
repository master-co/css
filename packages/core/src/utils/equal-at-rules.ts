import { AT_IDENTIFIERS } from '../common'
import type { SyntaxRule } from '../syntax-rule'
import { AtRuleNode } from './parse-at'

function areNodesEqual(a: any, b: any): boolean {
    return (
        a.type === b.type &&
        a.value === b.value &&
        a.unit === b.unit &&
        a.name === b.name &&
        a.operator === b.operator &&
        areNodeArraysEqual(a.children ?? [], b.children ?? [])
    )
}

function areNodeArraysEqual(aNodes: AtRuleNode[], bNodes: AtRuleNode[]): boolean {
    if (aNodes.length !== bNodes.length) return false

    const matched = new Array(bNodes.length).fill(false)

    for (const aNode of aNodes) {
        const index = bNodes.findIndex((bNode, i) => !matched[i] && areNodesEqual(aNode, bNode))
        if (index === -1) return false
        matched[index] = true
    }

    return true
}

export default function equalAtRules(a: SyntaxRule['atRules'], b: SyntaxRule['atRules']) {
    return AT_IDENTIFIERS.every(key =>
        areNodeArraysEqual(a?.[key] ?? [], b?.[key] ?? [])
    )
}