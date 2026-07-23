import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'
import { fromRustLintDiagnostics } from '@master/css-tooling/lint/node'

export default createRule({
  name: 'sort-classes',
  meta: {
    type: 'layout',
    fixable: 'code',
    docs: {
      description: 'Sort Master CSS classes'
    },
    messages: {
      invalidClassOrder: '{{message}}',
    },
    schema: []
  },
  defaultOptions: [],
  create: function (context) {
    const { settings, rustLint } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({ context, rustLint, ruleId: 'sort-classes' })
    }
    return defineVisitors({ context, settings, rustLint }, (node, resolved) => {
      const { raw, start, end, nodes, unescape } = resolved
      if (nodes.length <= 1) return
      const rustDiagnostics = fromRustLintDiagnostics(
        rustLint.analyzeClassList(raw, resolved.classValues).diagnostics
          .filter(({ ruleId }) => ruleId === 'sort-classes')
      )
      reportLintDiagnostics(
        context,
        node,
        { raw, start, end, nodes, unescape, value: raw, classNodes: [], classValues: [] },
        rustDiagnostics
      )
    })
  },
})
