import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import type { RawValuePolicyOptions } from '@master/css-tooling/lint'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'
import { createMasterCSSLintDiagnostics } from '@master/css-tooling/lint'

export default createRule({
  name: 'no-unapproved-raw-values',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow unapproved raw values in token-backed Master CSS classes'
    },
    messages: {
      unapprovedRawValue: '{{message}}',
    },
    fixable: null,
    schema: [{
      type: 'object',
      properties: {
        allowRawValues: { type: 'boolean' },
        allowProperties: {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true
        },
        allowedPatterns: {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true
        }
      },
      additionalProperties: false
    }]
  },
  defaultOptions: [{
    allowRawValues: false,
    allowProperties: [],
    allowedPatterns: []
  }],
  create(context) {
    const { settings, tooling } = resolveContext(context)
    const options = (context.options[0] || {}) as RawValuePolicyOptions
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({
        context,
        tooling,
        ruleId: 'no-unapproved-raw-values',
        ruleOptions: options
      })
    }

    return defineVisitors({ context, settings, tooling }, (node, resolved) => {
      const diagnostics = createMasterCSSLintDiagnostics(
        tooling.analyzeLintClassList(resolved.raw, resolved.classValues, {
          rawValuePolicy: options
        }).diagnostics.filter(({ ruleId }) => ruleId === 'no-unapproved-raw-values')
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
