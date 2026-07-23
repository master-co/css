import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import resolveComposeDirectiveClassNodes from '../utils/resolve-compose-directive-class-nodes'
import createRule from '../create-rule'
import {
  defaultCanonicalClassNameOptions,
  type CanonicalClassNameOptions
} from '@master/css-tooling/lint'
import { fromRustLintDiagnostics } from '@master/css-tooling/lint/node'
import type { ResolvedClassNode } from '../utils/resolve-class-node'
import type { ResolvedComposeDirectiveClassNode } from '../utils/resolve-compose-directive-class-nodes'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'

export default createRule({
  name: 'prefer-canonical-classes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer canonical Master CSS classes'
    },
    messages: {
      preferClass: '{{message}}',
    },
    fixable: 'code',
    schema: [{
      type: 'object',
      properties: {
        preferStaticUtilities: { type: 'boolean' },
        preferThemeTokens: { type: 'boolean' },
        preferPropertyAliases: { type: 'boolean' },
        preferVariableReferences: { type: 'boolean' },
        preferMultiValueTokens: { type: 'boolean' },
        preferCompositionUtilities: { type: 'boolean' },
        preferConditionOrder: { type: 'boolean' },
        preferNativeDeclarationsInCompose: { type: 'boolean' },
        preferVariantBlocksInCompose: { type: 'boolean' },
      },
      additionalProperties: false
    }]
  },
  defaultOptions: [defaultCanonicalClassNameOptions],
  create(context) {
    const { settings, rustLint } = resolveContext(context)
    const options = {
      ...defaultCanonicalClassNameOptions,
      ...((context.options[0] || {}) as Partial<CanonicalClassNameOptions>)
    }
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({
        context,
        rustLint,
        ruleId: 'prefer-canonical-classes',
        ruleOptions: options
      })
    }

    const reportCanonicalClassList = (node, { raw, start, end, unescape, classNodes, classValues }: ResolvedClassNode) => {
      reportLintDiagnostics(
        context,
        node,
        { raw, start, end, unescape, classNodes, classValues, nodes: [], value: raw },
        fromRustLintDiagnostics(
          rustLint.analyzeClassList(raw, classValues, {
            canonicalOptions: options
          }).diagnostics.filter(({ ruleId }) => ruleId === 'prefer-canonical-classes')
        )
      )
    }

    const reportCanonicalComposeDirective = (node, classNode: ResolvedComposeDirectiveClassNode) => {
      reportLintDiagnostics(
        context,
        node,
        classNode,
        fromRustLintDiagnostics(
          rustLint.analyzeClassList(classNode.raw, classNode.classValues, {
            canonicalOptions: options,
            composeDirective: true
          }).diagnostics.filter(({ ruleId }) => ruleId === 'prefer-canonical-classes')
        ),
        {
          getFix(_, fix) {
            if (fix.scope !== 'directive') {
              return {
                range: [classNode.start + fix.range.start, classNode.start + fix.range.end],
                text: fix.text
              }
            }
            return {
              range: [classNode.directiveStart, classNode.directiveEnd],
              text: formatComposeDirectiveReplacement(
                context.sourceCode.getText(),
                classNode.directiveStart,
                fix.text
              )
            }
          }
        }
      )
    }

    const visitors = defineVisitors({ context, settings, rustLint }, reportCanonicalClassList)
    const visitProgram = visitors.Program

    return {
      ...visitors,
      Program(node) {
        if (typeof visitProgram === 'function') {
          visitProgram(node)
        }
        for (const classNode of resolveComposeDirectiveClassNodes(context, rustLint)) {
          reportCanonicalComposeDirective(node, classNode)
        }
      }
    }
  }
})

function getLinePrefix(source: string, index: number) {
  return source.slice(source.lastIndexOf('\n', index - 1) + 1, index)
}

function formatComposeDirectiveReplacement(source: string, index: number, replacement: string) {
  const linePrefix = getLinePrefix(source, index)
  if (/\S/.test(linePrefix)) return replacement.replace(/\n\s*/g, ' ')
  return replacement.replace(/\n/g, `\n${linePrefix}`)
}
