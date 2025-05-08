import { SELECTOR_COMBINATORS } from '../common'
import createCSS from '../create'
import parsePair from './parse-pair'

export declare type SelectorLiteralNode = {
    type?: 'attribute' | 'pseudo-class' | 'pseudo-element' | 'class' | 'universal' | 'id'
    raw?: string
    value?: string
    children?: SelectorNode[]
}

export declare type SelectorSeparatorNode = {
    type: 'separator'
    raw?: string
    value: string
}

export declare type SelectorCombinatorNode = {
    type: 'combinator'
    raw?: string
    value: string
}

export declare type SelectorNode = SelectorLiteralNode | SelectorCombinatorNode | SelectorSeparatorNode

const SELECTOR_REGEX = new RegExp(`(?:[a-zA-Z0-9-]+)|([${SELECTOR_COMBINATORS.join('')}#.:,*])|(a-zA-Z0-9-)`, 'g')

export default function parseSelector(token: string, css = createCSS(), isRaw = true) {
    const resolve = (eachToken: string): SelectorNode[] => {
        const nodes: SelectorNode[] = []
        let currentPrefix = ''
        let tokenIndex = 0

        for (const match of eachToken.matchAll(SELECTOR_REGEX)) {
            const raw = match[0]
            tokenIndex += raw.length

            if (raw === ':' || raw === '.' || raw === '#') {
                currentPrefix += raw
                continue
            }

            let type: SelectorNode['type'] | undefined
            let value = raw
            const definedNodes = css.selectors.get(currentPrefix + raw)

            if (definedNodes) {
                const firstNode = definedNodes[definedNodes.length - 1]
                nodes.push(definedNodes.length === 1 && firstNode.type
                    ? { ...firstNode, raw: currentPrefix + raw }
                    : { children: definedNodes, raw: currentPrefix + raw }
                )
                currentPrefix = ''
                continue
            }

            if (SELECTOR_COMBINATORS.includes(raw)) {
                type = 'combinator'
                if (raw === '_') {
                    const nextRawValue = eachToken[tokenIndex]
                    const prevRawValue = eachToken[tokenIndex - raw.length - 1]
                    if (prevRawValue !== '_' && nextRawValue !== '_') {
                        value = ' ' // support BEM __
                    }
                }
            } else if (raw === ',') {
                type = 'separator'
            } else if (raw === '*') {
                type = 'universal'
            } else if (currentPrefix === ':') {
                type = 'pseudo-class'
            } else if (currentPrefix === '::') {
                type = 'pseudo-element'
            } else if (currentPrefix === '.') {
                type = 'class'
            } else if (currentPrefix === '#') {
                type = 'id'
            }

            nodes.push({
                value,
                ...(isRaw && { raw: currentPrefix + raw }),
                ...(type && { type }),
            })
            currentPrefix = ''
        }

        return nodes
    }

    const pair = (eachToken: string, nodes: SelectorNode[] = []): SelectorNode[] => {
        const paired = parsePair(eachToken)
        if (paired) {
            let { pre, body, post } = paired
            let name: string | undefined

            if (body) {
                const lastColonIndex = pre.lastIndexOf(':')
                if (lastColonIndex !== -1) {
                    name = pre.slice(lastColonIndex)
                    pre = pre.slice(0, lastColonIndex)
                }
            }

            if (pre) nodes.push(...pair(pre))
            if (body) {
                const children = pair(body)
                if (name) {
                    const node = resolve(name)[0] as SelectorLiteralNode
                    if (children.length) node.children = children
                    nodes.push(node)
                } else {
                    nodes.push(...children)
                }
            }
            if (post) nodes.push(...pair(post))
            return nodes
        }

        const attrPaired = parsePair(eachToken, '[', ']')
        if (attrPaired) {
            const { pre, body, post } = attrPaired
            if (pre) nodes.push(...pair(pre))
            nodes.push({
                value: body,
                type: 'attribute',
                ...(isRaw && { raw: `[${body}]` }),
            })
            if (post) nodes.push(...pair(post))
            return nodes
        }

        return resolve(eachToken)
    }

    return pair(token)
}
