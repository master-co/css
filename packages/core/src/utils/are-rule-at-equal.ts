import type { SyntaxRule } from '../syntax-rule'
import { AtComponent } from '../types/syntax'

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

function areComponentArraysEqual(aComps: AtComponent[], bComps: AtComponent[]): boolean {
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
    const keys: (keyof NonNullable<SyntaxRule['atComponents']>)[] = ['media', 'supports', 'container', 'layer']
    return keys.every(key =>
        areComponentArraysEqual(a.atComponents?.[key] ?? [], b.atComponents?.[key] ?? [])
    )
}