import { AtRuleNode } from './parse-at'

export default function getSingleAtNumberRuleNode(nodes: AtRuleNode[]) {
    if (nodes.length !== 1) return
    let atNumberRuleNode = nodes[0]
    if (atNumberRuleNode.type === 'number') return atNumberRuleNode
}