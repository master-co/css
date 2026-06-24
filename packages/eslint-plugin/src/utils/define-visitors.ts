import { TSESTree } from '@typescript-eslint/utils'
import type { RuleContext, RuleListener } from '@typescript-eslint/utils/ts-eslint'
import { Settings } from '../settings'
import withVisitClassNode from './with-visit-class-node'
import resolveClassNode from './resolve-class-node'

export default function defineVisitors({ context, settings }: { context: RuleContext<any, any[]>, settings: Settings }, visitNode: (node: TSESTree.Node, resolved: ReturnType<typeof resolveClassNode>) => void): RuleListener {
    const classAttributeRegex = new RegExp(`^(?:${settings.classAttributes.join('|')})$`)
    const classFunctionsRegex = new RegExp(`^(?:${settings.classFunctions.join('|')})$`)
    const classDeclarationsRegex = new RegExp(`^(?:${settings.classDeclarations.join('|')})$`)
    const visitClassNode = withVisitClassNode(visitNode, context)

    const getStaticName = (node: any): string | undefined => {
        if (!node) return
        if (node.type === 'Identifier') return node.name
        if (node.type === 'Literal' && typeof node.value === 'string') return node.value
    }

    const getMemberExpressionName = (node: any): string | undefined => {
        if (!node || node.type !== 'MemberExpression') return
        const objectName = getStaticName(node.object)
        const propertyName = getStaticName(node.property)
        if (!objectName || !propertyName) return
        return `${objectName}.${propertyName}`
    }

    const getCalleeName = (node: any): string | undefined => {
        const calleeNode = node.callee || node.tag
        return getStaticName(calleeNode) || getMemberExpressionName(calleeNode)
    }

    const allowCalleeNode = (node: any) => {
        const calleeName = getCalleeName(node)
        return calleeName ? classFunctionsRegex.test(calleeName) : false
    }

    const getPropertyName = (prop: any) => getStaticName(prop.key)

    const visitUtilityDefinitions = (node) => {
        if (!node) return
        if (node.type === 'ArrayExpression') {
            node.elements.forEach((element) => {
                if (!element || element.type === 'ObjectExpression') return
                visitClassNode(element)
            })
            return
        }
        if (node.type !== 'ObjectExpression') {
            visitClassNode(node)
            return
        }
    }
    const visitClassDeclarationNode = (name, node) => {
        if (name !== 'utilities') {
            visitClassNode(node)
            return
        }
        visitUtilityDefinitions(node)
    }
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
                    visitClassDeclarationNode(decl.id.name, decl.init)
                }
            })
        },
        ObjectExpression: function (node) {
            node.properties.forEach((prop) => {
                if (prop.type === 'Property') {
                    const propName = getPropertyName(prop)
                    if (typeof propName === 'string' && classDeclarationsRegex.test(propName)) {
                        visitClassDeclarationNode(propName, prop.value)
                    }
                }
            })
        }
    }
    const templateBodyVisitor: RuleListener = {
        CallExpression,
        VAttribute: function (node: any) {
            const name = node.key?.argument?.name || node.key?.name
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
