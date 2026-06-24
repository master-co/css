import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import { noInvalidClassesOptionsSchema } from '../settings-schema'
import { getClassValidationIssues } from '@master/css-lint'

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
        return defineVisitors({ context, settings }, (_, { classNodes }) => {
            for (const node of classNodes) {
                const issues = getClassValidationIssues(node.value, css, {
                    disallowUnknownClass: options.disallowUnknownClass,
                    displayClassName: node.raw
                })
                for (const issue of issues) {
                    context.report({
                        loc: node.loc,
                        messageId: issue.kind === 'invalid' ? 'invalidClass' : 'disallowUnknownClass',
                        data: {
                            message: issue.message
                        }
                    })
                }
            }
        })
    }
})
