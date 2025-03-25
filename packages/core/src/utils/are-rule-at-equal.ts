import type { SyntaxRule } from '../syntax-rule'
import { AtComponent } from '../types/syntax'

export default function areRuleAtEqual(a: SyntaxRule, b: SyntaxRule) {
    const compare = (aList?: AtComponent[], bList?: AtComponent[]) => {
        const aResolved = (aList ?? []).map(a.resolveAtComponent)
        const bResolved = (bList ?? []).map(b.resolveAtComponent)
        return aResolved.length === bResolved.length &&
            aResolved.every(val => bResolved.includes(val)) &&
            bResolved.every(val => aResolved.includes(val))
    }
    return (
        compare(a.mediaAtComponents, b.mediaAtComponents) &&
        compare(a.supportsAtComponents, b.supportsAtComponents) &&
        compare(a.containerAtComponents, b.containerAtComponents) &&
        compare(a.layerAtComponents, b.layerAtComponents)
    )
}