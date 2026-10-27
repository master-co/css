import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import {
  defaultCanonicalClassNameOptions,
  type CanonicalClassNameOptions
} from '@master/css-tooling/lint'
import { createMasterCSSLintDiagnostics } from '@master/css-tooling/lint'
import type { ResolvedClassNode } from '../utils/resolve-class-node'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'
import defineSourceVisitors, { shouldUseSourceVisitors } from '../utils/define-source-visitors'
import withContextRelease from '../utils/with-context-release'

export default createRule({
  name: 'prefer-canonical-classes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer canonical Master CSS classes'
    },
    messages: {
      preferClass: '{{message}}',
    },
    fixable: 'code',
    schema: [{
      type: 'object',
      properties: {
        preferStaticUtilities: { type: 'boolean' },
        preferCompositionUtilities: { type: 'boolean' },
      },
      additionalProperties: false
    }]
  },
  defaultOptions: [defaultCanonicalClassNameOptions],
  create(context) {
    const { settings, tooling, release } = resolveContext(context)
    const options = {
      ...defaultCanonicalClassNameOptions,
      ...((context.options[0] || {}) as Partial<CanonicalClassNameOptions>)
    }
    if (shouldUseSourceVisitors(context)) {
      return withContextRelease(defineSourceVisitors({
        context,
        tooling,
        ruleId: 'prefer-canonical-classes',
        ruleOptions: options
      }), release)
    }

    const reportCanonicalClassList = (node, resolved: ResolvedClassNode) => {
      reportLintDiagnostics(
        context,
        node,
        resolved,
        createMasterCSSLintDiagnostics(
          tooling.analyzeLintClassList(resolved.analysisText ?? resolved.raw, resolved.classValues, {
            canonicalOptions: options
          }).diagnostics.filter(({ ruleId }) => ruleId === 'prefer-canonical-classes')
        )
      )
    }

    return withContextRelease(defineVisitors({ context, settings, tooling }, reportCanonicalClassList), release)
  }
})
