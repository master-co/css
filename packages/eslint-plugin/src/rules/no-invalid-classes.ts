import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import { noInvalidClassesOptionsSchema } from '../settings-schema'
import { createInvalidClassesReport } from '@master/css-lint'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'

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
        const { options, settings, css } = resolveContext(context)
        return defineVisitors({ context, settings }, (node, resolved) => {
            reportLintDiagnostics(
                context,
                node,
                resolved,
                createInvalidClassesReport(resolved.raw, css, {
                    unescape: resolved.unescape,
                    disallowUnknownClass: options.disallowUnknownClass
                }).diagnostics
            )
        })
    }
})
