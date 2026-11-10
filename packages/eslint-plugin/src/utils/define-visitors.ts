import { TSESTree } from '@typescript-eslint/utils'
import type { RuleContext, RuleListener } from '@typescript-eslint/utils/ts-eslint'
import { Settings } from '../settings'
import withVisitClassNode from './with-visit-class-node'
import resolveClassNode from './resolve-class-node'
import type { MasterCSSToolingSession } from '@master/css-tooling'

export default function defineVisitors(
  { context, settings, tooling }: {
    context: RuleContext<any, any[]>
    settings: Settings
    tooling: Pick<MasterCSSToolingSession, 'tokenizeClassList' | 'decodeHTMLAttribute'>
  },
  visitNode: (node: TSESTree.Node, resolved: ReturnType<typeof resolveClassNode>) => void
): RuleListener {
  const classAttributeRegex = new RegExp(`^(?:${settings.classAttributes.join('|')})$`)
  const classFunctionsRegex = new RegExp(`^(?:${settings.classFunctions.join('|')})$`)
  const classDeclarationsRegex = new RegExp(`^(?:${settings.classDeclarations.join('|')})$`)
  const ignoredKeysRegex = settings.ignoredKeys.length ? new RegExp(`^(?:${settings.ignoredKeys.join('|')})$`) : undefined
  const visitClassNode = withVisitClassNode(visitNode, context, tooling, ignoredKeysRegex)
  // Astro's `class:list` is a namespaced JSX attribute; it lists classes like `class`.
  const isClassAttribute = (name: any) => {
    if (typeof name?.name === 'string') return classAttributeRegex.test(name.name)
    return name?.type === 'JSXNamespacedName' && name.namespace?.name === 'class' && name.name?.name === 'list'
      && classAttributeRegex.test('class')
  }

  const getStaticName = (node: any): string | undefined => {
    if (!node) return
    if (node.type === 'Identifier') return node.name
    if (node.type === 'Literal' && typeof node.value === 'string') return node.value
  }

  const getMemberExpressionName = (node: any): string | undefined => {
    if (!node || node.type !== 'MemberExpression') return
    // `element.classList.add` matches `classList.add` by its last two names.
    const objectName = getStaticName(node.object)
      ?? (node.object?.type === 'MemberExpression' && !node.object.computed ? getStaticName(node.object.property) : undefined)
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
      if (!node.name || !isClassAttribute(node.name)) return
      if (node.value) {
        visitClassNode(node.value)
      }
    },
    SvelteAttribute: function (node: any) {
      if (!node.key?.name || !classAttributeRegex.test(node.key.name)) return
      node.value.forEach((eachValue: any, index: number) => {
        if (eachValue.type === 'SvelteMustacheTag') {
          visitClassNode(eachValue.expression)
          return
        }
        // Text touching `{expression}` is part of a class that only exists at runtime,
        // as in `bg:{color}-50`: it is not a class list to sort, dedupe or validate.
        const before = node.value[index - 1]
        const after = node.value[index + 1]
        if (before?.type === 'SvelteMustacheTag' && !/^\s/.test(eachValue.value)) return
        if (after?.type === 'SvelteMustacheTag' && !/\s$/.test(eachValue.value)) return
        visitClassNode(eachValue)
      })
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
      } else if (node.value?.type === 'VExpressionContainer' && node.value.expression) {
        visitClassNode(node.value.expression)
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
