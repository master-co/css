import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import { createConflictingClassesReport } from '@master/css-lint'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'

export default createRule({
  name: 'no-conflicting-classes',
  meta: {
    type: 'layout',
    docs: {
      description: 'Disallow conflicting Master CSS classes'
    },
    messages: {
      collisionClass: '{{message}}',
      partialCollisionClass: 'Prefer "{{replacement}}" over "{{actual}}" because "{{conflict}}" overrides part of it.',
    },
    fixable: 'code',
    schema: []
  },
  defaultOptions: [],
  create(context) {
    const { settings, css } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({ context, css, ruleId: 'no-conflicting-classes' })
    }
    return defineVisitors({ context, settings }, (node, resolved) => {
      reportLintDiagnostics(
        context,
        node,
        resolved,
        createConflictingClassesReport(resolved.raw, css, { unescape: resolved.unescape }).diagnostics
      )
    })
  },
})
