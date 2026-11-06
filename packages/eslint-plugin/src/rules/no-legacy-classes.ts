import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'
import { createMasterCSSLintDiagnostics } from '@master/css-tooling/lint'
import withContextRelease from '../utils/with-context-release'

export default createRule({
  name: 'no-legacy-classes',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow pre-2.0 property:value classes and rewrite them to their 2.0 spelling'
    },
    messages: {
      legacyClass: '{{message}}',
    },
    fixable: 'code',
    schema: []
  },
  defaultOptions: [],
  create(context) {
    const { settings, tooling, release } = resolveContext(context)
    if (shouldUseSourceVisitors(context)) {
      return withContextRelease(defineSourceVisitors({
        context,
        tooling,
        ruleId: 'no-legacy-classes'
      }), release)
    }

    return withContextRelease(defineVisitors({ context, settings, tooling }, (node, resolved) => {
      reportLintDiagnostics(
        context,
        node,
        resolved,
        createMasterCSSLintDiagnostics(
          tooling.analyzeLintClassList(resolved.analysisText ?? resolved.raw, resolved.classValues, {
            legacyClasses: true
          }).diagnostics.filter(({ ruleId }) => ruleId === 'no-legacy-classes')
        )
      )
    }), release)
  }
})
