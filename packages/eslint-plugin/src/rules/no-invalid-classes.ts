import defineVisitors from '../utils/define-visitors'
import resolveContext, { requireResolvedCSS } from '../utils/resolve-context'
import createRule from '../create-rule'
import { noInvalidClassesOptionsSchema } from '../settings-schema'
import { createInvalidClassesReport } from '@master/css-lint'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'
import { fromRustLintDiagnostics } from '@master/css-lint/node'

export default createRule({
  name: 'no-invalid-classes',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow invalid Master CSS classes'
    },
    messages: {
      invalidClass: '{{message}}',
      disallowUnknownClass: '{{message}}',
    },
    fixable: null,
    schema: [noInvalidClassesOptionsSchema]
  },
  defaultOptions: [],
  create: function (context) {
    const { options, settings, css, rustLint } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({
        context,
        css,
        rustLint,
        ruleId: 'no-invalid-classes',
        ruleOptions: {
          disallowUnknownClass: options.disallowUnknownClass
        }
      })
    }
    return defineVisitors({ context, settings }, (node, resolved) => {
      const rustDiagnostics = rustLint
        ? fromRustLintDiagnostics(
          rustLint.analyzeClassList(resolved.raw, resolved.classValues, {
            disallowUnknownClass: options.disallowUnknownClass
          }).diagnostics.filter(({ ruleId }) => ruleId === 'no-invalid-classes'),
          'error'
        )
        : undefined
      reportLintDiagnostics(
        context,
        node,
        resolved,
        rustDiagnostics || createInvalidClassesReport(resolved.raw, requireResolvedCSS(css), {
          unescape: resolved.unescape,
          disallowUnknownClass: options.disallowUnknownClass
        }).diagnostics
      )
    })
  }
})
