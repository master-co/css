import { TSESTree } from '@typescript-eslint/utils'
import type { RuleContext, RuleListener } from '@typescript-eslint/utils/ts-eslint'
import { Settings } from '../settings'
import withVisitClassNode from './with-visit-class-node'
import resolveClassNode from './resolve-class-node'

export default function defineVisitors({ context, settings }: { context: RuleContext<any, any[]>, settings: Settings }, visitNode: (node: TSESTree.Node, resolved: ReturnType<typeof resolveClassNode>) => void): RuleListener {
    const classAttributeRegex = new RegExp(`^(?:${settings.classAttributes.join('|')})$`)
    const classFunctionsRegex = new RegExp(`^(?:${settings.classFunctions.join('|')})`)
    const classDeclarationsRegex = new RegExp(`^(?:${settings.classDeclarations.join('|')})$`)
    const allowCalleeNode = (node) => {
        let calleeName = ''
        const calleeNode = node.callee || node.tag
        if (calleeNode.type === 'Identifier') {
            calleeName = calleeNode.name
        }
        if (calleeNode.type === 'MemberExpression') {
            calleeName = `${calleeNode.object.name}.${calleeNode.property.name}`
        }
        return classFunctionsRegex.test(calleeName)
    }
    const visitClassNode = withVisitClassNode(visitNode, context)
    const CallExpression = function (node) {
        if (!allowCalleeNode(node)) return
        node.arguments.forEach((node) => {
            visitClassNode(node)
        })
    }
    const scriptVisitor: RuleListener = {
        CallExpression,
        JSXAttribute: function (node: any) {
            if (!node.name || !classAttributeRegex.test(node.name.name)) return
            if (node.value) {
                visitClassNode(node.value)
            }
        },
        SvelteAttribute: function (node: any) {
            if (!node.key?.name || !classAttributeRegex.test(node.key.name)) return
            for (const eachValue of node.value) {
                visitClassNode(eachValue)
            }
        },
        TextAttribute: function (node: any) {
            if (!node.name || !classAttributeRegex.test(node.name)) return
            visitClassNode(node)
        },
        TaggedTemplateExpression: function (node) {
            if (allowCalleeNode(node)) {
                visitClassNode(node.quasi)
                return
            }
        },
        VariableDeclaration: function (node) {
            node.declarations.forEach((decl) => {
                if (decl.id.type === 'Identifier' && classDeclarationsRegex.test(decl.id.name)) {
                    visitClassNode(decl.init)
                }
            })
        },
        ObjectExpression: function (node) {
            node.properties.forEach((prop) => {
                if (prop.type === 'Property' && prop.key.type === 'Identifier' && classDeclarationsRegex.test(prop.key.name)) {
                    visitClassNode(prop.value)
                }
            })
        }
    }
    const templateBodyVisitor: RuleListener = {
        CallExpression,
        VAttribute: function (node: any) {
            const name = node.key.argument?.name || node.key.name
            if (!name || !classAttributeRegex.test(name)) return
            if (node.value && node.value.type === 'VLiteral') {
                visitClassNode(node.value)
            } else if (node.value) {
                if (node.value.type === 'VExpressionContainer') {
                    if (node.value.expression?.type === 'ArrayExpression' || node.value.expression?.type === 'ObjectExpression') {
                        visitClassNode(node.value.expression)
                    }
                }
            }
        }
    }

    // @ts-expect-error defineTemplateBodyVisitor
    if (context.sourceCode.parserServices == null || context.sourceCode.parserServices.defineTemplateBodyVisitor == null) {
        return scriptVisitor
    } else {
        // @ts-expect-error defineTemplateBodyVisitor
        return context.sourceCode.parserServices.defineTemplateBodyVisitor(templateBodyVisitor, scriptVisitor)
    }
}