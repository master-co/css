import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import { createSortClassesReport } from '@master/css-lint'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'

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
    const { settings, css } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({ context, css, ruleId: 'sort-classes' })
    }
    return defineVisitors({ context, settings }, (node, { raw, start, end, nodes, unescape }) => {
      if (nodes.length <= 1) return
      reportLintDiagnostics(
        context,
        node,
        { raw, start, end, nodes, unescape, value: raw, classNodes: [], classValues: [] },
        createSortClassesReport(raw, css, { unescape }).diagnostics
      )
    })
  },
})
