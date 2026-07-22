import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import {
  createUnapprovedRawValueClassesReport,
  type RawValuePolicyOptions
} from '@master/css-lint'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'

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
    const { settings, css, rustLint } = resolveContext(context)
    const options = (context.options[0] || {}) as RawValuePolicyOptions
    if (shouldUseSourceVisitors(context)) {
      return defineSourceVisitors({
        context,
        css,
        rustLint,
        ruleId: 'no-unapproved-raw-values',
        ruleOptions: options
      })
    }

    return defineVisitors({ context, settings }, (node, resolved) => {
      reportLintDiagnostics(
        context,
        node,
        resolved,
        createUnapprovedRawValueClassesReport(resolved.raw, css, {
          ...options,
          unescape: resolved.unescape
        }).diagnostics
      )
    })
  }
})
