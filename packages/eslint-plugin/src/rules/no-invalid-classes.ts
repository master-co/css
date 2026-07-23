import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import { noInvalidClassesOptionsSchema } from '../settings-schema'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'
import { createMasterCSSLintDiagnostics } from '@master/css-tooling/lint'

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
    const { options, settings, tooling } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({
        context,
        tooling,
        ruleId: 'no-invalid-classes',
        ruleOptions: {
          disallowUnknownClass: options.disallowUnknownClass
        }
      })
    }
    return defineVisitors({ context, settings, tooling }, (node, resolved) => {
      const diagnostics = createMasterCSSLintDiagnostics(
        tooling.analyzeLintClassList(resolved.raw, resolved.classValues, {
          disallowUnknownClass: options.disallowUnknownClass
        }).diagnostics.filter(({ ruleId }) => ruleId === 'no-invalid-classes'),
        'error'
      )
      reportLintDiagnostics(
        context,
        node,
        resolved,
        diagnostics
      )
    })
  }
})
