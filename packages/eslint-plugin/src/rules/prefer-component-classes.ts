import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import type { RemoteStylingPolicyOptions } from '@master/css-tooling/lint'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'
import { createMasterCSSLintDiagnostics } from '@master/css-tooling/lint'
import withContextRelease from '../utils/with-context-release'

export default createRule({
  name: 'prefer-component-classes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer a component class over many classes that style other elements through combinators'
    },
    messages: {
      remoteStylingLimit: '{{message}}',
    },
    fixable: null,
    schema: [{
      type: 'object',
      properties: {
        max: { type: 'integer', minimum: 0 }
      },
      additionalProperties: false
    }]
  },
  defaultOptions: [{}],
  create(context) {
    const { settings, tooling, release } = resolveContext(context)
    const options = (context.options[0] || {}) as RemoteStylingPolicyOptions
    if (shouldUseSourceVisitors(context)) {
      return withContextRelease(defineSourceVisitors({
        context,
        tooling,
        ruleId: 'prefer-component-classes',
        ruleOptions: options
      }), release)
    }

    return withContextRelease(defineVisitors({ context, settings, tooling }, (node, resolved) => {
      const diagnostics = createMasterCSSLintDiagnostics(
        tooling.analyzeLintClassList(resolved.analysisText ?? resolved.raw, resolved.classValues, {
          remoteStylingPolicy: options
        }).diagnostics.filter(({ ruleId }) => ruleId === 'prefer-component-classes')
      )
      reportLintDiagnostics(
        context,
        node,
        resolved,
        diagnostics
      )
    }), release)
  }
})
