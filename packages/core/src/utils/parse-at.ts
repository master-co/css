import { AT_COMPARABLE_FEATURES, AT_COMPARISON_OPERATORS, AT_IDENTIFIERS, AT_LOGICAL_OPERATORS } from '../common'
import createCSS from '../create'
import { AtIdentifier } from '../types/config'
import parsePair from './parse-pair'
import parseValue from './parse-value'
import replaceCharOutsideQuotes from './replace-char-outside-quotes'
import splitCharOutsideQuotes from './split-char-outside-quotes'

export type AtRule = {
    id: AtIdentifier
    nodes: AtRuleNode[]
}
export declare type AtRuleNumberNode = { raw?: string, name: string, type: 'number', value: number, unit?: string, operator?: string }
export declare type AtRuleStringNode = { raw?: string, name: string, type: 'string', value: string }
export declare type AtRuleValueNode = AtRuleNumberNode | AtRuleStringNode
export interface AtRuleComparisonOperatorNode { type: 'comparison', raw?: string, value: string }
export interface AtRuleLogicalOperatorNode { type: 'logical', raw?: string, value: string }
export type AtRuleOperatorNode = AtRuleComparisonOperatorNode | AtRuleLogicalOperatorNode
export interface AtRuleGroupNode { type?: 'group', raw?: string, children: AtRuleNode[] }
export type AtRuleNode = AtRuleValueNode | AtRuleComparisonOperatorNode | AtRuleLogicalOperatorNode | AtRuleGroupNode

export default function parseAt(token: string, css = createCSS(), isRaw = true) {
    let id: AtIdentifier | undefined
    let firstToken: string | undefined
    const resolve = (token: string) => {
        const regex = /([a-zA-Z0-9-:%|]+|[&|!|,|>|<|=][=]?)/g
        const raws = [...token.matchAll(regex)].map(match => match[0])
        let nodes: AtRuleNode[] = []
        const addNode = (node: AtRuleNode) => {
            let prev = nodes[nodes.length - 1]
            if (node.type === 'number' && !node.name) {
                if (prev?.type === 'comparison') {
                    node.operator = prev.value
                    if (node.raw && prev.raw) {
                        node.raw = prev.raw + node.raw
                    }
                    nodes.pop()
                    prev = nodes[nodes.length - 1]
                    if (prev?.type === 'string') {
                        node.name = prev.value
                        if (node.raw && prev.raw) {
                            node.raw = prev.raw + node.raw
                        }
                        nodes.pop()
                    } else {
                        node.name = 'width'
                    }
                } else {
                    node.name = 'width'
                    node.operator = '>='
                }
            }
            nodes.push(node)
        }
        raws
            .forEach((raw) => {
                if (AT_COMPARISON_OPERATORS.includes(raw)) {
                    const newNode = { type: 'comparison', value: raw } as AtRuleComparisonOperatorNode
                    if (isRaw) newNode.raw = raw
                    nodes.push(newNode)
                    return
                } else if (raw in AT_LOGICAL_OPERATORS) {
                    const newNode = { type: 'logical', value: AT_LOGICAL_OPERATORS[raw as keyof typeof AT_LOGICAL_OPERATORS] } as AtRuleLogicalOperatorNode
                    if (isRaw) newNode.raw = raw
                    nodes.push(newNode)
                    return
                }
                const definedAtRule = css.atRules.get(raw)
                if (!id && !firstToken) {
                    firstToken = raw
                    if (AT_IDENTIFIERS.includes(firstToken)) {
                        id = firstToken as AtIdentifier
                        return
                    } else if (definedAtRule) {
                        id = definedAtRule.id
                    } else if (AT_COMPARABLE_FEATURES.includes(firstToken)) {
                        id = 'media'
                    } else if (firstToken.charAt(0).match(/[a-zA-Z-]/)) {
                        id = 'container'
                    } else {
                        id = 'media'
                    }
                }
                let node = { type: 'string' } as AtRuleValueNode
                if (isRaw) node.raw = raw
                if (definedAtRule) {
                    if (definedAtRule.nodes.length === 1) {
                        addNode({ ...definedAtRule.nodes[0], raw })
                    } else if (definedAtRule.nodes.length) {
                        addNode({ raw, children: definedAtRule.nodes })
                    }
                    return
                } else {
                    const [splitedNameOrValue, splitedValue] = splitCharOutsideQuotes(raw, ':')
                    if (splitedValue) {
                        node.name = splitedNameOrValue
                        node.value = splitedValue
                    } else {
                        node.value = splitedNameOrValue
                    }
                    if (id === 'container' || id === 'media') {
                        const { token, ...newNode } = parseValue(node.value, 'rem', css.config.rootSize)
                        Object.assign(node, newNode)
                    }
                    addNode(node)
                }
            })

        return nodes
    }

    const pair = (token: string) => {
        const pairedAtNodes: AtRuleNode[] = []
        const paired = parsePair(token)
        if (paired) {
            if (paired.pre) {
                pairedAtNodes.push(...pair(paired.pre))
            }
            if (paired.body) {
                if (id === 'supports') {
                    pairedAtNodes.push({
                        type: 'group',
                        children: [{
                            type: 'string',
                            value: replaceCharOutsideQuotes(paired.body, '|', ' '),
                        } as AtRuleStringNode]
                    })
                } else {
                    const children = pair(paired.body)
                    if (children.length > 1) {
                        pairedAtNodes.push({
                            type: 'group', children: pair(paired.body)
                        } as unknown as AtRuleGroupNode)
                    } else {
                        pairedAtNodes.push(...children)
                    }
                }
            }
            if (paired.post) {
                pairedAtNodes.push(...pair(paired.post))
            }
        } else {
            pairedAtNodes.push(...resolve(token))
        }
        return pairedAtNodes
    }
    return {
        nodes: pair(token),
        id: id || 'media' // should be assigned to here
    } as AtRule
}