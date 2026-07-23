import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'
import { createMasterCSSLintDiagnostics } from '@master/css-tooling/lint'

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
    const { settings, tooling } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({ context, tooling, ruleId: 'no-conflicting-classes' })
    }
    return defineVisitors({ context, settings, tooling }, (node, resolved) => {
      const diagnostics = createMasterCSSLintDiagnostics(
        tooling.analyzeLintClassList(resolved.raw, resolved.classValues).diagnostics
          .filter(({ ruleId }) => ruleId === 'no-conflicting-classes')
      )
      reportLintDiagnostics(
        context,
        node,
        resolved,
        diagnostics
      )
    })
  },
})
