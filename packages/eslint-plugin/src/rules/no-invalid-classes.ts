import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import { noInvalidClassesOptionsSchema } from '../settings-schema'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'
import { fromRustLintDiagnostics } from '@master/css-tooling/lint/node'

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
    const { options, settings, rustLint } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({
        context,
        rustLint,
        ruleId: 'no-invalid-classes',
        ruleOptions: {
          disallowUnknownClass: options.disallowUnknownClass
        }
      })
    }
    return defineVisitors({ context, settings, rustLint }, (node, resolved) => {
      const rustDiagnostics = fromRustLintDiagnostics(
        rustLint.analyzeClassList(resolved.raw, resolved.classValues, {
          disallowUnknownClass: options.disallowUnknownClass
        }).diagnostics.filter(({ ruleId }) => ruleId === 'no-invalid-classes'),
        'error'
      )
      reportLintDiagnostics(
        context,
        node,
        resolved,
        rustDiagnostics
      )
    })
  }
})
