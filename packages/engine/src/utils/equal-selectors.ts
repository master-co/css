import type { SelectorNode, SelectorLiteralNode } from './parse-selector'

function isCombinator(node: SelectorNode) {
    return node.type === 'combinator'
}

function areSelectorNodesEqual(a: SelectorNode, b: SelectorNode): boolean {
    if (a.type !== b.type) return false
    if (a.value !== b.value) return false

    const aChildren = (a as SelectorLiteralNode).children ?? []
    const bChildren = (b as SelectorLiteralNode).children ?? []
    if (aChildren.length !== bChildren.length) return false

    return equalUnorderedSelectorNodes(aChildren, bChildren)
}

function equalUnorderedSelectorNodes(a: SelectorNode[], b: SelectorNode[]): boolean {
    if (a.length !== b.length) return false

    const unmatchedB = new Set(b)
    for (const nodeA of a) {
        let matched = false
        for (const nodeB of unmatchedB) {
            if (areSelectorNodesEqual(nodeA, nodeB)) {
                unmatchedB.delete(nodeB)
                matched = true
                break
            }
        }
        if (!matched) return false
    }

    return true
}

function splitByCombinators(nodes: SelectorNode[]): (SelectorNode[] | SelectorNode)[] {
    const parts: (SelectorNode[] | SelectorNode)[] = []
    let buffer: SelectorNode[] = []

    for (const node of nodes) {
        if (isCombinator(node)) {
            if (buffer.length > 0) {
                parts.push(buffer)
                buffer = []
            }
            parts.push(node) // push combinator as-is
        } else {
            buffer.push(node)
        }
    }

    if (buffer.length > 0) {
        parts.push(buffer)
    }

    return parts
}

export default function equalSelectors(a: SelectorNode[] = [], b: SelectorNode[] = []): boolean {
    const aParts = splitByCombinators(a)
    const bParts = splitByCombinators(b)

    if (aParts.length !== bParts.length) return false

    for (let i = 0; i < aParts.length; i++) {
        const partA = aParts[i]
        const partB = bParts[i]

        if (Array.isArray(partA) && Array.isArray(partB)) {
            if (!equalUnorderedSelectorNodes(partA, partB)) return false
        } else if (!Array.isArray(partA) && !Array.isArray(partB)) {
            // both are combinators
            if (!areSelectorNodesEqual(partA, partB)) return false
        } else {
            return false // mismatch between combinator vs non-combinator
        }
    }

    return true
}
