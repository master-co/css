import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'
import { fromRustLintDiagnostics } from '@master/css-lint/node'

export default createRule({
  name: 'no-conflicting-classes',
  meta: {
    type: 'layout',
    docs: {
      description: 'Disallow conflicting Master CSS classes'
    },
    messages: {
      collisionClass: '{{message}}',
      partialCollisionClass: '{{message}}',
    },
    fixable: 'code',
    schema: []
  },
  defaultOptions: [],
  create(context) {
    const { settings, rustLint } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({ context, rustLint, ruleId: 'no-conflicting-classes' })
    }
    return defineVisitors({ context, settings, rustLint }, (node, resolved) => {
      const rustDiagnostics = fromRustLintDiagnostics(
        rustLint.analyzeClassList(resolved.raw, resolved.classValues).diagnostics
          .filter(({ ruleId }) => ruleId === 'no-conflicting-classes')
      )
      reportLintDiagnostics(
        context,
        node,
        resolved,
        rustDiagnostics
      )
    })
  },
})
