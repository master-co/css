import defineVisitors from '../utils/define-visitors'
import resolveContext, { requireResolvedCSS } from '../utils/resolve-context'
import createRule from '../create-rule'
import { createConflictingClassesReport } from '@master/css-lint'
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
    const { settings, css, rustLint } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({ context, css, rustLint, ruleId: 'no-conflicting-classes' })
    }
    return defineVisitors({ context, settings }, (node, resolved) => {
      const rustDiagnostics = rustLint
        ? fromRustLintDiagnostics(
          rustLint.analyzeClassList(resolved.raw, resolved.classValues).diagnostics
            .filter(({ ruleId }) => ruleId === 'no-conflicting-classes')
        )
        : undefined
      reportLintDiagnostics(
        context,
        node,
        resolved,
        rustDiagnostics || createConflictingClassesReport(
          resolved.raw,
          requireResolvedCSS(css),
          { unescape: resolved.unescape }
        ).diagnostics
      )
    })
  },
})
