import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'
import { createMasterCSSLintDiagnostics } from '@master/css-tooling/lint'

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
    const { settings, tooling } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({ context, tooling, ruleId: 'sort-classes' })
    }
    return defineVisitors({ context, settings, tooling }, (node, resolved) => {
      const { raw, start, end, nodes, unescape } = resolved
      if (nodes.length <= 1) return
      const diagnostics = createMasterCSSLintDiagnostics(
        tooling.analyzeLintClassList(raw, resolved.classValues).diagnostics
          .filter(({ ruleId }) => ruleId === 'sort-classes')
      )
      reportLintDiagnostics(
        context,
        node,
        { raw, start, end, nodes, unescape, value: raw, classNodes: [], classValues: [] },
        diagnostics
      )
    })
  },
})
