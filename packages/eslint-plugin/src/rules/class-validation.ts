import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import settingsSchema from '../settings-schema'
import { validate } from '@master/css-validator'

export default createRule({
    name: 'syntax-error-checks',
    meta: {
        type: 'problem',
        docs: {
            description: 'Detect syntax errors early when writing classes'
        },
        messages: {
            invalidClass: '{{message}}',
            disallowUnknownClass: '{{message}}',
        },
        fixable: null,
        schema: [settingsSchema]
    },
    defaultOptions: [],
    create: function (context) {
        const { options, settings, css } = resolveContext(context)
        return defineVisitors({ context, settings }, (_, { classNodes }) => {
            for (const node of classNodes) {
                const { matched, errors } = validate(node.value, css)
                if (errors.length > 0) {
                    for (const error of errors) {
                        if (matched) {
                            context.report({
                                node,
                                messageId: 'invalidClass',
                                data: {
                                    message: error.message + '.',
                                }
                            })
                        } else if (options.disallowUnknownClass) {
                            context.report({
                                node,
                                messageId: 'disallowUnknownClass',
                                data: {
                                    message: `"${node.raw}" is not a valid or known class.`
                                }
                            })
                        }
                    }
                }
            }
        })
    }
})