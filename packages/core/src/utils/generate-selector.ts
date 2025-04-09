import { SELECTOR_COMBINATORS } from '../common'
import { SelectorNode } from './parse-selector'

const prefixMap: Record<string, string> = {
    'class': '.',
    'pseudo-class': ':',
    'pseudo-element': '::',
    'attribute': '',
    'combinator': ''
}

export default function generateSelector(nodes: SelectorNode[], body = ''): string {
    const generate = (node: SelectorNode): string => {
        if (node.type === 'attribute') return `[${node.value}]`
        if (node.type === 'combinator') return node.value

        const prefix = node.type && prefixMap[node.type] || ''
        const base = node.value ? prefix + node.value : ''

        if ('children' in node && node.children?.length) {
            const childrenText = node.children.map(generate).join('')
            return node.value ? base + `(${childrenText})` : base + childrenText
        }
        return base
    }

    let pre = ''
    let current = ''
    const groups: string[] = []
    const flatNodes = nodes.flatMap(node => (!('value' in node) && 'children' in node && node.children?.length) ? node.children : node)

    flatNodes
        .forEach(node => {
            if (node.value === ',') {
                groups.push(current)
                current = ''
            } else if (node.value === 'of' && 'children' in node) {
                pre += node.children!.map(generate).join('')
            } else {
                current += generate(node)
            }
        })

    if (current) groups.push(current)
    if (pre) {
        const lastChar = pre.charAt(pre.length - 1)
        if (!SELECTOR_COMBINATORS.includes(lastChar) && lastChar !== ' ') {
            pre += ' '
        }
    }
    const result = groups.length
        ? groups.map(text => pre + body + text).join(',')
        : pre + body

    if (process.env.NODE_ENV === 'development') {
        /** Warning: Nodes before `:of()` cannot contain combinators or other ::pseudo-element nodes */
        const ofIndex = flatNodes.findIndex(node => node.type === 'pseudo-class' && node.value === 'of')
        if (ofIndex > 0) {
            const hasCombinator = flatNodes.slice(0, ofIndex).some(node => node.type === 'combinator')
            const hasPseudoElement = flatNodes.slice(0, ofIndex).some(node => node.type === 'pseudo-element')
            if (hasCombinator || hasPseudoElement) {
                console.warn(`Cannot use combinators or pseudo-elements before ':of()' selector: '${result}'`)
            }
        }
    }

    return result
}
