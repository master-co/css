import { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import resolveClassNode from './resolve-class-node'
import { TSESTree } from '@typescript-eslint/utils'

export default function withVisitClassNode(
    visit: (node: TSESTree.Node, resolved: ReturnType<typeof resolveClassNode>) => void,
    context: RuleContext<any, any[]>
) {
    const visitNode = (node) => {
        switch (node.type) {
            case 'BinaryExpression':
            case 'Identifier':
                return
            case 'TemplateLiteral':
                node.expressions?.forEach(visitNode)
                node.quasis.forEach(visitNode)
                return
            case 'JSXExpressionContainer':
                visitNode(node.expression)
                return
            case 'ConditionalExpression':
                visitNode(node.consequent)
                visitNode(node.alternate)
                return
            case 'ArrayExpression':
                node.elements.forEach((el) => {
                    visitNode(el)
                })
                return
            case 'LogicalExpression':
                visitNode(node.right)
                return
            case 'ObjectExpression':
                node.properties.forEach((prop) => {
                    visitNode(prop)
                })
                return
            case 'Property':
                if (node.shorthand) return
                if (node.value && ['Literal', 'ArrayExpression', 'ObjectExpression'].includes(node.value.type) && typeof node.value?.value !== 'boolean') {
                    visitNode(node.value)
                } else if (node.key.type === 'Literal') {
                    visitNode(node.key)
                }
                return
            default:
                let resolved = resolveClassNode(node, context)
                if (!resolved) return
                visit(node, resolved)
        }
    }
    return visitNode
}