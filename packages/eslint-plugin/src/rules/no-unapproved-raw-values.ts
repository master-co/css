import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import {
    createUnapprovedRawValueClassesReport,
    type RawValuePolicyOptions
} from '@master/css-lint'
import reportLintDiagnostics from '../utils/report-lint-diagnostics'

export default createRule({
    name: 'no-unapproved-raw-values',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow unapproved raw values in token-backed Master CSS classes'
        },
        messages: {
            unapprovedRawValue: 'Unexpected raw value "{{value}}" in "{{className}}". Use a token or allow it explicitly.',
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
        const { settings, css } = resolveContext(context)
        const options = (context.options[0] || {}) as RawValuePolicyOptions

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
