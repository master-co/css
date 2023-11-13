import type { RuleListener } from '@typescript-eslint/utils/dist/ts-eslint'
import { Rule } from 'eslint'

export default function defineVisitors({ context, settings }: { context: Rule.RuleContext, settings: any }, visitNode) {

    const isFnNode = (node) => {
        let calleeName = ''
        const calleeNode = node.callee || node.tag
        if (calleeNode.type === 'Identifier') {
            calleeName = calleeNode.name
        }
        if (calleeNode.type === 'MemberExpression') {
            calleeName = `${calleeNode.object.name}.${calleeNode.property.name}`
        }
        return new RegExp(settings.calleeMatching).test(calleeName)
    }

    const CallExpression = function (node) {
        if (!isFnNode(node)) {
            return
        }
        node.arguments.forEach((arg) => {
            visitNode(node, arg)
        })
    }

    const classMatchingRegex = new RegExp(settings.classMatching)

    const scriptVisitor: RuleListener = {
        CallExpression,
        JSXAttribute: function (node: any) {
            if (!node.name || !classMatchingRegex.test(node.name.name)) return
            if (node.value && node.value.type === 'Literal') {
                visitNode(node)
            } else if (node.value && node.value.type === 'JSXExpressionContainer') {
                visitNode(node, node.value.expression)
            }
        },
        SvelteAttribute: function (node: any) {
            if (!node.key?.name || !classMatchingRegex.test(node.key.name)) return
            for (const eachValue of node.value) {
                visitNode(node, eachValue)
            }
        },
        TextAttribute: function (node: any) {
            if (!node.name || !classMatchingRegex.test(node.name)) return
            visitNode(node)
        },
        TaggedTemplateExpression: function (node) {
            if (isFnNode(node)) {
                visitNode(node, node.quasi)
                return
            }
        },
    }

    const templateBodyVisitor: RuleListener = {
        CallExpression,
        VAttribute: function (node: any) {
            if (node.value && node.value.type === 'VLiteral') {
                visitNode(node)
            } else if (node.value && node.value.type === 'VExpressionContainer' && node.value.expression.type === 'ArrayExpression') {
                node.value.expression.elements.forEach((arg) => {
                    visitNode(node, arg)
                })
            } else if (node.value && node.value.type === 'VExpressionContainer' && node.value.expression.type === 'ObjectExpression') {
                node.value.expression.properties.forEach((prop) => {
                    visitNode(node, prop)
                })
            }
        },
    }

    if (context.sourceCode.parserServices == null || context.sourceCode.parserServices.defineTemplateBodyVisitor == null) {
        return scriptVisitor
    } else {
        return context.sourceCode.parserServices.defineTemplateBodyVisitor(templateBodyVisitor, scriptVisitor)
    }
}